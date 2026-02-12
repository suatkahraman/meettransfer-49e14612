import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
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

  // Driver/Customer/Agency: Role çözülene kadar bekle - 10 sn grace (aynı cihaz 2. giriş)
  const [roleGraceExpired, setRoleGraceExpired] = useState(false);
  useEffect(() => {
    setRoleGraceExpired(false);

    if (!user) return;
    if (roleLoading) return;
    if (role) return;

    const t = window.setTimeout(() => setRoleGraceExpired(true), 10000);
    return () => window.clearTimeout(t);
  }, [user, roleLoading, role]);

  // Show loading state while checking auth and role
  if (authLoading || roleLoading || (user && !role && !roleGraceExpired)) {
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

  // If role is still unknown after grace period, fall back to least-privileged area.
  if (!role) {
    return <Navigate to="/customer" replace />;
  }

  // Redirect if user doesn't have required role
  if (!allowedRoles.includes(role)) {
    // Redirect to appropriate home page based on role
    const roleRedirects: Record<AppRole, string> = {
      admin: '/admin',
      driver: '/driver',
      customer: '/customer',
      agency: '/agency'
    };
    
    const redirect = roleRedirects[role] ?? redirectTo;
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
