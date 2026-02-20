import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SUPER_ADMIN_ID = '9f380270-56d1-40e3-abe8-41ea6d3afe5f';

interface Props {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: Props) => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null); // null: bilinmiyor/loading

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

      // Süper admin bypass
      if (user.id === SUPER_ADMIN_ID) {
        if (mounted) {
          setAllowed(true);
          setChecking(false);
          console.log('Current User ID:', user?.id);
          console.log('Is Admin:', true);
        }
        return;
      }

      try {
        const ok = await isAdmin();
        if (mounted) {
          setAllowed(ok); // null ise loading, true/false ise karar
          setChecking(false);
          console.log('Current User ID:', user?.id);
          console.log('Is Admin:', ok);
        }
      } catch (err) {
        if (mounted) {
          setAllowed(null);
          setChecking(false);
          console.log('Current User ID:', user?.id);
          console.log('Is Admin:', null);
        }
      }
    };

    check();
    return () => { mounted = false; };
  }, [user, authLoading, isAdmin]);


  // Profil/rol yüklenmeden yönlendirme yapma (iOS dahil)
  if (authLoading || checking || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Yükleniyor...</div>
      </div>
    );
  }

  if (allowed === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
