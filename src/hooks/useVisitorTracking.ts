import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_ID_KEY = 'mt_visitor_id';
const GEO_CACHE_KEY = 'mt_geo_cache';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_INTERVAL = 60000; // 60 seconds (reduced from 30s)
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce for page changes

interface GeoCache {
  data: { countryCode: string; countryName: string; city: string };
  timestamp: number;
}

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

function getCachedGeo(): GeoCache['data'] | null {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: GeoCache = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > GEO_CACHE_TTL) {
      localStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedGeo(data: GeoCache['data']): void {
  try {
    const cache: GeoCache = { data, timestamp: Date.now() };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile';
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

// Domains that should be excluded from tracking
const EXCLUDED_DOMAINS = [
  'lovableproject.com',
  'lovable.app',
  'localhost',
  '127.0.0.1',
];

// Roles that should be excluded from tracking
const EXCLUDED_ROLES: Array<'admin' | 'driver' | 'agency'> = ['admin', 'driver', 'agency'];

function isExcludedDomain(): boolean {
  const hostname = window.location.hostname;
  return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
}

export function useVisitorTracking() {
  const location = useLocation();
  const visitIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceRef = useRef<any | null>(null);
  const lastPathRef = useRef<string>('');
  const lastHeartbeatRef = useRef<number>(0);
  const [isExcludedUser, setIsExcludedUser] = useState<boolean>(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const ctxRef = useRef<{
    visitorId: string;
    sessionStart: string;
    browser: string;
    device: string;
    referrer: string | null;
    geo: { countryCode: string; countryName: string; city: string };
  } | null>(null);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (presenceRef.current) {
      supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
    }
    visitIdRef.current = null;
    ctxRef.current = null;
  }, []);

  // Check excluded user status on mount and auth changes
  useEffect(() => {
    let isMounted = true;
    
    const checkExcluded = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (!user) {
          setIsExcludedUser(false);
          setIsAuthChecked(true);
          return;
        }
        
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', EXCLUDED_ROLES)
          .limit(1);
        
        if (!isMounted) return;
        
        if (error) {
          console.error('[VisitorTracking] Role check error:', error);
          setIsExcludedUser(true);
          stopTracking();
        } else {
          const hasExcludedRole = roleData && roleData.length > 0;
          setIsExcludedUser(hasExcludedRole);
          if (hasExcludedRole) stopTracking();
        }
      } catch (err) {
        console.error('[VisitorTracking] checkExcluded error:', err);
        if (isMounted) {
          setIsExcludedUser(true);
          stopTracking();
        }
      }
      
      if (isMounted) setIsAuthChecked(true);
    };
    
    checkExcluded();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      stopTracking();
      setIsAuthChecked(false);
      setIsExcludedUser(true);
      setTimeout(() => { if (isMounted) checkExcluded(); }, 100);
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [stopTracking]);

  useEffect(() => {
    if (!isAuthChecked || isExcludedUser || isExcludedDomain()) return;
    
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

      // Use cached geo or fetch new
      let geo = getCachedGeo();
      if (!geo) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const geoResponse = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            geo = {
              countryCode: geoData.country_code || '',
              countryName: geoData.country_name || '',
              city: geoData.city || ''
            };
            setCachedGeo(geo);
          }
        } catch {
          geo = { countryCode: '', countryName: '', city: '' };
        }
      }

      ctxRef.current = {
        visitorId,
        sessionStart,
        browser: getBrowserInfo(),
        device: getDeviceInfo(),
        referrer: document.referrer || null,
        geo: geo || { countryCode: '', countryName: '', city: '' },
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
          // Ignore presence errors
        }
      });
    };

    const heartbeat = async (force = false) => {
      const now = Date.now();
      const pathChanged = location.pathname !== lastPathRef.current;
      
      // Skip if not enough time has passed and path hasn't changed (unless forced)
      if (!force && !pathChanged && now - lastHeartbeatRef.current < ACTIVITY_INTERVAL * 0.9) {
        return;
      }

      const ctx = await ensureContext();
      if (!ctx || cancelled) return;

      lastPathRef.current = location.pathname;
      lastHeartbeatRef.current = now;

      await ensurePresenceChannel(ctx);

      const lastActivity = new Date().toISOString();

      // 1) Live presence update
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
        // Ignore
      }

      // 2) DB write via edge function
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

        if (!error) {
          const newVisitId = (data as any)?.visit_id || (data as any)?.id;
          if (newVisitId) visitIdRef.current = newVisitId;
        }
      } catch (err) {
        console.error('[VisitorTracking] unexpected error:', err);
      }
    };

    // Debounced heartbeat for page changes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      void heartbeat(true);
    }, DEBOUNCE_DELAY);

    // Set up interval for regular heartbeats
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        void heartbeat();
      }, ACTIVITY_INTERVAL);
    }

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [location.pathname, isExcludedUser, isAuthChecked, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);
}
