import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [fallbackRole, setFallbackRole] = useState<AppRole | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const allowedRolesKey = allowedRoles.join('|');

  // If role lookup fails or times out, verify the currently requested area directly.
  useEffect(() => {
    let isActive = true;

    const verifyFallbackRole = async () => {
      if (!user || roleLoading || role) {
        setFallbackRole(null);
        setFallbackLoading(false);
        return;
      }

      setFallbackLoading(true);
      try {
        if (allowedRoles.includes('driver')) {
          const { data: driverRow } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (isActive && driverRow?.id) {
            setFallbackRole('driver');
            return;
          }
        }

        if (allowedRoles.includes('agency')) {
          const { data: agencyRow } = await supabase
            .from('agencies')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (isActive && agencyRow?.id) {
            setFallbackRole('agency');
            return;
          }
        }

        if (allowedRoles.includes('admin')) {
          const { data: adminRoleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (isActive && adminRoleRow?.role === 'admin') {
            setFallbackRole('admin');
            return;
          }
        }

        if (isActive) {
          // Customer area is the least-privileged authenticated fallback.
          setFallbackRole(allowedRoles.includes('customer') ? 'customer' : null);
        }
      } catch (error) {
        console.warn('[ProtectedRoute] fallback role check failed:', error);
        if (isActive) setFallbackRole(null);
      } finally {
        if (isActive) setFallbackLoading(false);
      }
    };

    void verifyFallbackRole();
    return () => {
      isActive = false;
    };
  }, [user?.id, role, roleLoading, allowedRolesKey]);

  // Driver/Customer/Agency: Role çözülene kadar bekle - 10 sn grace (aynı cihaz 2. giriş)
  const [roleGraceExpired, setRoleGraceExpired] = useState(false);
  useEffect(() => {
    setRoleGraceExpired(false);

    if (!user) return;
    if (roleLoading) return;
    if (fallbackLoading) return;
    if (role || fallbackRole) return;

    const t = window.setTimeout(() => setRoleGraceExpired(true), 10000);
    return () => window.clearTimeout(t);
  }, [user, roleLoading, role, fallbackLoading, fallbackRole]);

  // Show loading state while checking auth and role
  if (authLoading || roleLoading || fallbackLoading || (user && !role && !fallbackRole && !roleGraceExpired)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to appropriate login page if not logged in
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  const effectiveRole = role ?? fallbackRole;

  // If role is still unknown after grace period, return to route-specific login.
  if (!effectiveRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // Redirect if user doesn't have required role
  if (!allowedRoles.includes(effectiveRole)) {
    // Redirect to appropriate home page based on role
    const roleRedirects: Record<AppRole, string> = {
      admin: '/admin',
      driver: '/driver',
      customer: '/customer',
      agency: '/agency'
    };
    
    const redirect = roleRedirects[effectiveRole] ?? redirectTo;
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};

// Convenience components - her rol kendi giriş sayfasına yönlendirilir
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo="/auth">
    {children}
  </ProtectedRoute>
);

export const DriverRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['driver']} redirectTo="/login/driver">
    {children}
  </ProtectedRoute>
);

export const CustomerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['customer']} redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const AgencyRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['agency']} redirectTo="/login/agency">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
