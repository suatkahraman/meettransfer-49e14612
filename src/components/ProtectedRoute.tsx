import { ReactNode } from 'react';
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

  // Show loading state while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user doesn't have required role
  if (!role || !allowedRoles.includes(role)) {
    // Redirect to appropriate home page based on role
    const roleRedirects: Record<AppRole, string> = {
      admin: '/admin',
      driver: '/driver',
      customer: '/customer',
      agency: '/agency'
    };
    
    const redirect = role ? roleRedirects[role] : redirectTo;
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
};

// Convenience components for specific roles
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const DriverRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['driver']}>
    {children}
  </ProtectedRoute>
);

export const CustomerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['customer']}>
    {children}
  </ProtectedRoute>
);

export const AgencyRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['agency']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
