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
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setDriverId(null);
        setAgencyId(null);
        setLoading(false);
        return;
      }

      try {
        // 1) Edge function (RLS bypass) - retry ile ayni cihazdan tekrar giris garantisi
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        // Ayni cihazdan 2. giris: retry ile get-user-role guvencesi (cold start, network)
        if (token) {
          const delays = [0, 400, 800, 1200];
          for (let attempt = 0; attempt < delays.length; attempt++) {
            if (attempt > 0) await new Promise((r) => setTimeout(r, delays[attempt]));
            const { data: fnData } = await supabase.functions.invoke('get-user-role', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (fnData?.success && fnData?.role) {
              const detectedRole = fnData.role as AppRole;
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
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError || !roleData?.role) {
          // user_roles RLS hatası veya boş - drivers tablosundan dene (sürücü için)
          const { data: driverRow } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (driverRow?.id) {
            setRole('driver');
            setDriverId(driverRow.id);
          } else {
            setRole('customer');
          }
        } else {
          const detectedRole = (roleData.role as AppRole) || 'customer';
          setRole(detectedRole);

          if (roleData?.role === 'driver') {
            const { data: driverData } = await supabase
              .from('drivers')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            setDriverId(driverData?.id || null);
          }

          if (roleData?.role === 'agency') {
            const { data: agencyData } = await supabase
              .from('agencies')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            setAgencyId(agencyData?.id || null);
          }
        }
      } catch (error) {
        console.error('[useUserRole] Error:', error);
        setRole('customer');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading, driverId, agencyId };
};
