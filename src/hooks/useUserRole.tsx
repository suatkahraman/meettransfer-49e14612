import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'driver' | 'customer' | 'agency';

export const useUserRole = () => {
  const { user, session, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchRole = async () => {
      if (authLoading) return;

      if (!userId) {
        if (!isActive) return;
        setRole(null);
        setDriverId(null);
        setAgencyId(null);
        setLoading(false);
        return;
      }

      if (isActive) {
        setLoading(true);
        setDriverId(null);
        setAgencyId(null);
      }

      try {
        // Prefer AuthContext session first; fall back to getSession only when needed.
        let token = session?.access_token ?? null;
        if (!token) {
          const retryDelays = [120, 260, 420];
          for (const delay of retryDelays) {
            await new Promise((r) => setTimeout(r, delay));
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
              token = data.session.access_token;
              break;
            }
          }
        }

        // 1) Edge function (RLS bypass) - retry with small backoff
        if (token) {
          const delays = [0, 400, 800, 1200];
          for (let attempt = 0; attempt < delays.length; attempt++) {
            if (attempt > 0) await new Promise((r) => setTimeout(r, delays[attempt]));
            const { data: fnData } = await supabase.functions.invoke('get-user-role', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (fnData?.success && fnData?.role) {
              const detectedRole = fnData.role as AppRole;
              if (!isActive) return;
              setRole(detectedRole);
              setDriverId(fnData.driverId || null);
              setAgencyId(fnData.agencyId || null);
              setLoading(false);
              return;
            }
          }
        }

        // 2) Fallback: Direkt user_roles + drivers/agencies sorgusu (RLS gerekir)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError || !roleData?.role) {
          // user_roles RLS hatası veya boş - drivers tablosundan dene (sürücü için)
          const { data: driverRow } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          if (!isActive) return;
          if (driverRow?.id) {
            setRole('driver');
            setDriverId(driverRow.id);
          } else {
            setRole('customer');
          }
        } else {
          const detectedRole = (roleData.role as AppRole) || 'customer';
          if (!isActive) return;
          setRole(detectedRole);

          if (roleData?.role === 'driver') {
            const { data: driverData } = await supabase
              .from('drivers')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();
            if (!isActive) return;
            setDriverId(driverData?.id || null);
          }

          if (roleData?.role === 'agency') {
            const { data: agencyData } = await supabase
              .from('agencies')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();
            if (!isActive) return;
            setAgencyId(agencyData?.id || null);
          }
        }
      } catch (error) {
        console.error('[useUserRole] Error:', error);
        if (!isActive) return;
        setRole('customer');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void fetchRole();

    return () => {
      isActive = false;
    };
  }, [authLoading, userId, session?.access_token]);

  return { role, loading, driverId, agencyId };
};
