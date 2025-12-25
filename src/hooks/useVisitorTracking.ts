import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'mt_visitor_id';
const ACTIVITY_INTERVAL = 30000; // 30 seconds

function generateVisitorId(): string {
  return 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

// Excluded routes that shouldn't be tracked
const EXCLUDED_ROUTES = [
  '/admin',
  '/driver',
  '/customer',
  '/agency',
  '/auth',
  '/login',
  '/signup',
];

export function useVisitorTracking() {
  const location = useLocation();
  const visitIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't track admin/internal routes
    const isExcluded = EXCLUDED_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );
    
    if (isExcluded) {
      return;
    }

    const visitorId = getVisitorId();
    const now = new Date().toISOString();

    // Track page visit
    const trackVisit = async () => {
      try {
        // Get country info from free API
        let countryCode = '';
        let countryName = '';
        let city = '';
        
        try {
          const geoResponse = await fetch('https://ipapi.co/json/');
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            countryCode = geoData.country_code || '';
            countryName = geoData.country_name || '';
            city = geoData.city || '';
          }
        } catch {
          // Silently fail geo lookup
        }

        const { data, error } = await supabase
          .from('page_visits')
          .insert({
            visitor_id: visitorId,
            page_path: location.pathname,
            country_code: countryCode,
            country_name: countryName,
            city: city,
            browser: getBrowserInfo(),
            device: getDeviceInfo(),
            referrer: document.referrer || null,
            session_start: now,
            last_activity: now,
          })
          .select('id')
          .single();

        if (!error && data) {
          visitIdRef.current = data.id;
        }
      } catch (err) {
        console.error('Error tracking visit:', err);
      }
    };

    trackVisit();

    // Update last activity periodically
    const updateActivity = async () => {
      if (!visitIdRef.current) return;
      
      try {
        await supabase
          .from('page_visits')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', visitIdRef.current);
      } catch {
        // Silently fail
      }
    };

    intervalRef.current = setInterval(updateActivity, ACTIVITY_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [location.pathname]);
}
