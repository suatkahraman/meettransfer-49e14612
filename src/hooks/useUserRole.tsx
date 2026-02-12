import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'driver' | 'customer' | 'agency';

export const useUserRole = () => {
  const { user } = useAuth();
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

    const fetchDriverId = async (userId: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return null;
      return data?.id ?? null;
    };

    const fetchAgencyId = async (userId: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return null;
      return data?.id ?? null;
    };

    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setDriverId(null);
        setAgencyId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1) Edge function (RLS bypass) - retry ile ayni cihazdan tekrar giris garantisi
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        // Ayni cihazdan 2. giris: retry ile get-user-role guvencesi (cold start, network)
        // Not: Edge function "customer" dondururse hemen kabul etmiyoruz.
        // Yeni policy yapisinda dogrudan tablo fallback'i ile tekrar dogruluyoruz.
        if (token) {
          const delays = [0, 400, 800, 1200];
          for (let attempt = 0; attempt < delays.length; attempt++) {
            if (attempt > 0) await new Promise((r) => setTimeout(r, delays[attempt]));
            const { data: fnData } = await supabase.functions.invoke('get-user-role', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (fnData?.success && fnData?.role) {
              const detectedRole = resolveAppRole([fnData.role]);
              // Edge function'in stale olmasi durumunda false-negative customer
              // donusunu dogrudan kabul etmeyip DB fallback ile yeniden teyit edecegiz.
              if (detectedRole && detectedRole !== 'customer') {
                let resolvedDriverId = fnData.driverId || null;
                let resolvedAgencyId = fnData.agencyId || null;

                if (detectedRole === 'driver' && !resolvedDriverId) {
                  resolvedDriverId = await fetchDriverId(user.id);
                }

                if (detectedRole === 'agency' && !resolvedAgencyId) {
                  resolvedAgencyId = await fetchAgencyId(user.id);
                }

                setRole(detectedRole);
                setDriverId(detectedRole === 'driver' ? resolvedDriverId : null);
                setAgencyId(detectedRole === 'agency' ? resolvedAgencyId : null);
                setLoading(false);
                return;
              }
            }
          }
        }

        // 2) Fallback: Direkt user_roles + drivers/agencies sorgusu (RLS gerekir)
        // Yeni yapida bir kullanici birden fazla role sahip olabilir.
        const { data: roleRows, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError) {
          console.warn('[useUserRole] user_roles fallback error:', roleError.message);
        }

        let resolvedRole = resolveAppRole((roleRows ?? []).map((r) => r.role));
        let resolvedDriverId: string | null = null;
        let resolvedAgencyId: string | null = null;

        if (resolvedRole === 'driver') {
          resolvedDriverId = await fetchDriverId(user.id);
        }

        if (resolvedRole === 'agency') {
          resolvedAgencyId = await fetchAgencyId(user.id);
        }

        // user_roles kaydi yoksa veya rol stale ise tablo varligindan rol cikar
        if (!resolvedRole) {
          resolvedDriverId = await fetchDriverId(user.id);
          if (resolvedDriverId) {
            resolvedRole = 'driver';
          } else {
            resolvedAgencyId = await fetchAgencyId(user.id);
            if (resolvedAgencyId) {
              resolvedRole = 'agency';
            }
          }
        }

        setRole(resolvedRole ?? 'customer');
        setDriverId((resolvedRole ?? 'customer') === 'driver' ? resolvedDriverId : null);
        setAgencyId((resolvedRole ?? 'customer') === 'agency' ? resolvedAgencyId : null);
      } catch (error) {
        console.error('[useUserRole] Error:', error);
        setRole('customer');
        setDriverId(null);
        setAgencyId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading, driverId, agencyId };
};
