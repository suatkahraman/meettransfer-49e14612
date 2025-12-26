import { useEffect, useRef, useState } from 'react';
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

// Domains that should be excluded from tracking (development/preview environments)
const EXCLUDED_DOMAINS = [
  'lovableproject.com',
  'localhost',
  '127.0.0.1',
];

// Roles that should be excluded from tracking
const EXCLUDED_ROLES: Array<'admin' | 'driver' | 'agency'> = ['admin', 'driver', 'agency'];

// Check if current domain is a development/preview environment
function isExcludedDomain(): boolean {
  const hostname = window.location.hostname;
  return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
}


export function useVisitorTracking() {
  const location = useLocation();
  const visitIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenceRef = useRef<any | null>(null);
  const [isExcludedUser, setIsExcludedUser] = useState<boolean>(true); // Default to excluded until proven otherwise
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const ctxRef = useRef<{
    visitorId: string;
    sessionStart: string;
    browser: string;
    device: string;
    referrer: string | null;
    geo: { countryCode: string; countryName: string; city: string };
  } | null>(null);

  // Helper function to stop tracking
  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (presenceRef.current) {
      supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
    }
    visitIdRef.current = null;
    ctxRef.current = null; // Clear context to prevent stale data
  };

  // Check excluded user status on mount and auth changes
  useEffect(() => {
    let isMounted = true;
    
    const checkExcluded = async () => {
      try {
        // First check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        // If no user, they're not excluded (anonymous visitor)
        if (!user) {
          setIsExcludedUser(false);
          setIsAuthChecked(true);
          return;
        }
        
        // Check if authenticated user has excluded role
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', EXCLUDED_ROLES);
        
        if (!isMounted) return;
        
        if (error) {
          console.error('[VisitorTracking] Role check error:', error);
          // If error checking role, exclude by default for safety
          setIsExcludedUser(true);
          stopTracking();
        } else {
          const hasExcludedRole = roleData && roleData.length > 0;
          setIsExcludedUser(hasExcludedRole);
          
          // If user has excluded role, immediately stop tracking
          if (hasExcludedRole) {
            stopTracking();
          }
        }
      } catch (err) {
        console.error('[VisitorTracking] checkExcluded error:', err);
        if (isMounted) {
          setIsExcludedUser(true);
          stopTracking();
        }
      }
      
      if (isMounted) {
        setIsAuthChecked(true);
      }
    };
    
    checkExcluded();
    
    // Re-check on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Immediately stop tracking on any auth change
      stopTracking();
      
      // Reset state
      setIsAuthChecked(false);
      setIsExcludedUser(true); // Default to excluded until check completes
      
      // Re-check after a small delay to ensure auth state is stable
      setTimeout(() => {
        if (isMounted) {
          checkExcluded();
        }
      }, 100);
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    // Wait for auth check to complete
    if (!isAuthChecked) return;
    
    // Don't track admin, driver, agency users
    if (isExcludedUser) {
      stopTracking();
      return;
    }

    // Don't track development/preview environments (Lovable, localhost)
    if (isExcludedDomain()) {
      return;
    }
    
    const isExcluded = EXCLUDED_ROUTES.some((route) => location.pathname.startsWith(route));

    if (isExcluded) {
      stopTracking();
      return;
    }

    let cancelled = false;

    const ensureContext = async () => {
      if (ctxRef.current) return ctxRef.current;

      const visitorId = getVisitorId();
      const sessionStart = new Date().toISOString();

      // Geo lookup (best effort)
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
        // ignore
      }

      ctxRef.current = {
        visitorId,
        sessionStart,
        browser: getBrowserInfo(),
        device: getDeviceInfo(),
        referrer: document.referrer || null,
        geo: { countryCode, countryName, city },
      };

      return ctxRef.current;
    };

    const ensurePresenceChannel = async (ctx: NonNullable<typeof ctxRef.current>) => {
      if (presenceRef.current) return;

      const channel = supabase.channel('mt_visitors', {
        config: { presence: { key: ctx.visitorId } },
      });

      presenceRef.current = channel;

      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED' || cancelled) return;
        try {
          await channel.track({
            visitor_id: ctx.visitorId,
            page_path: location.pathname,
            country_code: ctx.geo.countryCode,
            country_name: ctx.geo.countryName,
            city: ctx.geo.city,
            browser: ctx.browser,
            device: ctx.device,
            last_activity: new Date().toISOString(),
          });
        } catch {
          // ignore presence errors
        }
      });
    };

    const heartbeat = async () => {
      const ctx = await ensureContext();
      if (!ctx || cancelled) return;

      await ensurePresenceChannel(ctx);

      const lastActivity = new Date().toISOString();

      // 1) Live presence (for anlık ziyaretçi)
      try {
        await presenceRef.current?.track({
          visitor_id: ctx.visitorId,
          page_path: location.pathname,
          country_code: ctx.geo.countryCode,
          country_name: ctx.geo.countryName,
          city: ctx.geo.city,
          browser: ctx.browser,
          device: ctx.device,
          last_activity: lastActivity,
        });
      } catch {
        // ignore
      }

      // 2) DB write (for historical analytics) via backend function
      try {
        const { data, error } = await supabase.functions.invoke('track-visit', {
          body: {
            visit_id: visitIdRef.current,
            visitor_id: ctx.visitorId,
            page_path: location.pathname,
            country_code: ctx.geo.countryCode,
            country_name: ctx.geo.countryName,
            city: ctx.geo.city,
            browser: ctx.browser,
            device: ctx.device,
            referrer: ctx.referrer,
            session_start: ctx.sessionStart,
            last_activity: lastActivity,
          },
        });

        if (error) {
          console.error('[VisitorTracking] track-visit error:', error);
          return;
        }

        const newVisitId = (data as any)?.visit_id || (data as any)?.id;
        if (newVisitId) visitIdRef.current = newVisitId;
      } catch (err) {
        console.error('[VisitorTracking] unexpected error:', err);
      }
    };

    void heartbeat();

    intervalRef.current = setInterval(() => {
      void heartbeat();
    }, ACTIVITY_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location.pathname, isExcludedUser, isAuthChecked]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, []);
}
