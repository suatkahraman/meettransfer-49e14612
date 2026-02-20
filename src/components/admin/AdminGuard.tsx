import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: Props) => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setChecking(true);
      if (authLoading) return;
      if (!user) {
        if (mounted) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      try {
        const ok = await isAdmin();
        if (mounted) {
          setAllowed(Boolean(ok));
          setChecking(false);
        }
      } catch (err) {
        if (mounted) {
          setAllowed(false);
          setChecking(false);
        }
      }
    };

    check();
    return () => { mounted = false; };
  }, [user, authLoading, isAdmin]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Yükleniyor...</div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
