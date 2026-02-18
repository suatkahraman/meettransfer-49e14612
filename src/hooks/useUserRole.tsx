import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'driver' | 'customer' | 'agency';
type LookupResult = { id: string | null; hasError: boolean };
type CachedRolePayload = {
  userId: string;
  role: AppRole;
  driverId: string | null;
  agencyId: string | null;
  expiresAt: number;
};

const ROLE_CACHE_KEY = 'mt_user_role_cache_v1';
const ROLE_CACHE_TTL_MS = 30 * 60 * 1000;
const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);

const isAppRole = (value: unknown): value is AppRole =>
  value === 'admin' || value === 'driver' || value === 'agency' || value === 'customer';

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    if (isIOS()) sessionStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* iOS private mode vb. */
    }
  }
}

const readUserRoleCache = (userId: string): CachedRolePayload | null => {
  try {
    const raw = safeStorageGet(ROLE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedRolePayload>;
    if (parsed.userId !== userId) return null;
    if (!isAppRole(parsed.role)) return null;
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
      try {
        localStorage.removeItem(ROLE_CACHE_KEY);
        sessionStorage.removeItem(ROLE_CACHE_KEY);
      } catch {
        /* ignore */
      }
      return null;
    }

    return {
      userId: parsed.userId,
      role: parsed.role,
      driverId: typeof parsed.driverId === 'string' ? parsed.driverId : null,
      agencyId: typeof parsed.agencyId === 'string' ? parsed.agencyId : null,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
};

export const primeUserRoleCache = (payload: {
  userId: string;
  role: AppRole;
  driverId?: string | null;
  agencyId?: string | null;
}) => {
  try {
    const cacheValue: CachedRolePayload = {
      userId: payload.userId,
      role: payload.role,
      driverId: payload.driverId ?? null,
      agencyId: payload.agencyId ?? null,
      expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    };
    safeStorageSet(ROLE_CACHE_KEY, JSON.stringify(cacheValue));
  } catch {
    // Storage can be unavailable in some iOS/private contexts.
  }
};

export const useUserRole = () => {
  const { user, session } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAppRole = (roles: string[]): AppRole | null => {
      const normalized = roles.filter((r): r is AppRole =>
        r === 'admin' || r === 'driver' || r === 'agency' || r === 'customer'
      );

      if (normalized.includes('admin')) return 'admin';
      if (normalized.includes('driver')) return 'driver';
      if (normalized.includes('agency')) return 'agency';
      if (normalized.includes('customer')) return 'customer';
      return null;
    };

    const fetchDriverId = async (userId: string): Promise<LookupResult> => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[useUserRole] drivers fallback error:', error.message);
        return { id: null, hasError: true };
      }
      return { id: data?.id ?? null, hasError: false };
    };

    const fetchAgencyId = async (userId: string): Promise<LookupResult> => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[useUserRole] agencies fallback error:', error.message);
        return { id: null, hasError: true };
      }
      return { id: data?.id ?? null, hasError: false };
    };

    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setDriverId(null);
        setAgencyId(null);
        setLoading(false);
        return;
      }

      // Hardcoded admin access for specific user
      if (user.id === '9f380270-56d1-40e3-abe8-41ea6d3afe5f') {
        console.log('[useUserRole] Hardcoded admin ID matched:', user.id);
        setRole('admin');
        setDriverId(null);
        setAgencyId(null);
        setLoading(false);
        return;
      }

      const cachedRole = readUserRoleCache(user.id);
      if (cachedRole) {
        setRole(cachedRole.role);
        setDriverId(cachedRole.role === 'driver' ? cachedRole.driverId : null);
        setAgencyId(cachedRole.role === 'agency' ? cachedRole.agencyId : null);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        // 1) Edge function (RLS bypass) - iOS: AuthContext session gecikmeli olabilir, getSession ile taze token al
        let token = session?.access_token;
        if (!token && isIOS()) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token ?? null;
        }
        if (token) {
          const { data: fnData } = await supabase.functions.invoke('get-user-role', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (fnData?.success && fnData?.role) {
            const detectedRole = resolveAppRole([fnData.role]);
            // Edge function stale "customer" false-negative olabilir; o yüzden customer
            // sonucunu DB fallback ile teyit etmeye devam ediyoruz.
            if (detectedRole && detectedRole !== 'customer') {
              let resolvedDriverId = fnData.driverId || null;
              let resolvedAgencyId = fnData.agencyId || null;

              if (detectedRole === 'driver' && !resolvedDriverId) {
                const driverLookup = await fetchDriverId(user.id);
                resolvedDriverId = driverLookup.id;
              }

              if (detectedRole === 'agency' && !resolvedAgencyId) {
                const agencyLookup = await fetchAgencyId(user.id);
                resolvedAgencyId = agencyLookup.id;
              }

              setRole(detectedRole);
              setDriverId(detectedRole === 'driver' ? resolvedDriverId : null);
              setAgencyId(detectedRole === 'agency' ? resolvedAgencyId : null);
              primeUserRoleCache({
                userId: user.id,
                role: detectedRole,
                driverId: resolvedDriverId,
                agencyId: resolvedAgencyId,
              });
              setLoading(false);
              return;
            }
          }
        }

        // 2) Fallback: Direkt user_roles + drivers/agencies sorgusu (RLS gerekir)
        // iOS: auth.uid() bazen ilk istekte null - RLS hata verirse kisa araliklarla tekrar dene
        const runFallback = async (): Promise<{
          roleRows: { role: string }[] | null;
          roleError: { message: string } | null;
          driverLookup: LookupResult;
          agencyLookup: LookupResult;
        }> => {
          const { data: roleRows, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          const driverLookup = await fetchDriverId(user.id);
          const agencyLookup = await fetchAgencyId(user.id);
          return { roleRows: roleRows ?? [], roleError, driverLookup, agencyLookup };
        };

        let result = await runFallback();
        if (isIOS() && (result.roleError || result.driverLookup.hasError || result.agencyLookup.hasError)) {
          for (const delay of [150, 300]) {
            await new Promise((r) => setTimeout(r, delay));
            result = await runFallback();
            if (!result.roleError && !result.driverLookup.hasError && !result.agencyLookup.hasError) break;
          }
        }

        const { roleRows, roleError, driverLookup, agencyLookup } = result;
        if (roleError) {
          console.warn('[useUserRole] user_roles fallback error:', roleError.message);
        }

        let resolvedRole = resolveAppRole((roleRows ?? []).map((r) => r.role));
        let hadLookupError = !!roleError;
        let resolvedDriverId: string | null = driverLookup.id;
        let resolvedAgencyId: string | null = agencyLookup.id;
        hadLookupError = hadLookupError || driverLookup.hasError || agencyLookup.hasError;

        if (resolvedRole === 'driver') {
          resolvedDriverId = driverLookup.id;
        }
        if (resolvedRole === 'agency') {
          resolvedAgencyId = agencyLookup.id;
        }

        // user_roles kaydi yoksa veya rol stale ise tablo varligindan rol cikar
        if (!resolvedRole) {
          if (resolvedDriverId) {
            resolvedRole = 'driver';
          } else if (resolvedAgencyId) {
            resolvedRole = 'agency';
          }
        }

        // Lookup hatasi varsa customer'a zorla dusme; role belirsiz kalsin.
        if (!resolvedRole && hadLookupError) {
          setRole(null);
          setDriverId(null);
          setAgencyId(null);
          return;
        }

        const finalRole = resolvedRole ?? 'customer';
        setRole(finalRole);
        setDriverId(finalRole === 'driver' ? resolvedDriverId : null);
        setAgencyId(finalRole === 'agency' ? resolvedAgencyId : null);
        primeUserRoleCache({
          userId: user.id,
          role: finalRole,
          driverId: resolvedDriverId,
          agencyId: resolvedAgencyId,
        });
      } catch (error) {
        console.error('[useUserRole] Error:', error);
        if (!cachedRole) {
          setRole(null);
          setDriverId(null);
          setAgencyId(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, session]);

  return { role, loading, driverId, agencyId };
};
