import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/** Production login redirect URLs with role param for centralized login */
const LOGIN_REDIRECT_BASE =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://meettransfer.app');
export const LOGIN_REDIRECT_URLS = {
  driver: `${LOGIN_REDIRECT_BASE}/login?role=driver`,
  customer: `${LOGIN_REDIRECT_BASE}/login?role=customer`,
  admin: `${LOGIN_REDIRECT_BASE}/login?role=admin`,
  agency: `${LOGIN_REDIRECT_BASE}/login?role=agency`,
} as const;

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

const ROLE_GRACE_MS = 4000;

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [fallbackRole, setFallbackRole] = useState<AppRole | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const userId = user?.id;
  const allowedRolesKey = allowedRoles.join('|');

  // If role lookup fails or times out, verify the currently requested area directly.
  useEffect(() => {
    let isActive = true;
    const allowedRoleList = (allowedRolesKey
      ? allowedRolesKey.split('|')
      : []) as AppRole[];

    const verifyFallbackRole = async () => {
      if (!userId || roleLoading || role) {
        setFallbackRole(null);
        setFallbackLoading(false);
        return;
      }

      setFallbackLoading(true);
      try {
        if (allowedRoleList.includes('driver')) {
          const { data: driverRow } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (isActive && driverRow?.id) {
            setFallbackRole('driver');
            return;
          }
        }

        if (allowedRoleList.includes('agency')) {
          const { data: agencyRow } = await supabase
            .from('agencies')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (isActive && agencyRow?.id) {
            setFallbackRole('agency');
            return;
          }
        }

        if (allowedRoleList.includes('admin')) {
          const { data: adminRoleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

          if (isActive && adminRoleRow?.role === 'admin') {
            setFallbackRole('admin');
            return;
          }
        }

        if (isActive) {
          // Customer area is the least-privileged authenticated fallback.
          setFallbackRole(allowedRoleList.includes('customer') ? 'customer' : null);
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
  }, [userId, role, roleLoading, allowedRolesKey]);

  // Driver/Customer/Agency: Role çözülene kadar bekle - 10 sn grace (aynı cihaz 2. giriş)
  const [roleGraceExpired, setRoleGraceExpired] = useState(false);
  useEffect(() => {
    setRoleGraceExpired(false);

    if (!userId) return;
    if (roleLoading) return;
    if (fallbackLoading) return;
    if (role || fallbackRole) return;

    const t = window.setTimeout(() => setRoleGraceExpired(true), ROLE_GRACE_MS);
    return () => window.clearTimeout(t);
  }, [userId, roleLoading, role, fallbackLoading, fallbackRole]);

  // iOS ITP: Hızlı yönlendirme bazen session henüz okunmadan tetiklenebilir.
  // getSession retry'ları tamamlansın diye kısa bir grace ekle (client-side Navigate, 302 değil).
  const [authRedirectGrace, setAuthRedirectGrace] = useState(false);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);

  useEffect(() => {
    if (!user && !authLoading && isIOS && !authRedirectGrace) {
      const t = window.setTimeout(() => setAuthRedirectGrace(true), 120);
      return () => window.clearTimeout(t);
    }
    if (user) setAuthRedirectGrace(false);
  }, [user, authLoading, isIOS, authRedirectGrace]);

  // Show loading state while checking auth and role
  if (authLoading || roleLoading || fallbackLoading || (user && !role && !fallbackRole && !roleGraceExpired)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to appropriate login page if not logged in
  // iOS: authRedirectGrace ile getSession retry'larına ek süre ver
  if (!user) {
    if (isIOS && !authRedirectGrace) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (redirectTo.startsWith('http')) {
      window.location.replace(redirectTo);
      return null;
    }
    return <Navigate to={redirectTo} replace />;
  }

  const effectiveRole = role ?? fallbackRole;

  // If role is still unknown after grace period, return to route-specific login.
  if (!effectiveRole) {
    if (redirectTo.startsWith('http')) {
      window.location.replace(redirectTo);
      return null;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Redirect if user doesn't have required role (to their home, not login)
  if (!allowedRoles.includes(effectiveRole)) {
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

// Convenience components - her rol kendi giriş sayfasına yönlendirilir (https://meettransfer.app/login?role=X)
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo={LOGIN_REDIRECT_URLS.admin}>
    {children}
  </ProtectedRoute>
);

export const DriverRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['driver']} redirectTo={LOGIN_REDIRECT_URLS.driver}>
    {children}
  </ProtectedRoute>
);

export const CustomerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['customer']} redirectTo={LOGIN_REDIRECT_URLS.customer}>
    {children}
  </ProtectedRoute>
);

export const AgencyRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['agency']} redirectTo={LOGIN_REDIRECT_URLS.agency}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
