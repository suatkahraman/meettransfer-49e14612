import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'driver' | 'customer';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setDriverId(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching role:', roleError);
          setRole('customer');
        } else {
          setRole((roleData?.role as AppRole) || 'customer');
        }

        // If user is a driver, fetch driver ID
        if (roleData?.role === 'driver') {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setDriverId(driverData?.id || null);
        }
      } catch (error) {
        console.error('Error:', error);
        setRole('customer');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading, driverId };
};
