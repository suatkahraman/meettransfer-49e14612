import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoleBasedRedirectProps {
  checkDriver?: boolean;
  checkAgency?: boolean;
}

export const RoleBasedRedirect = ({ 
  checkDriver = true, 
  checkAgency = true 
}: RoleBasedRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, loading } = useUserRole();
  const { t } = useLanguage();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (loading || hasRedirected) return;

    // Sadece belirli rolleri kontrol et
    if (checkDriver && role === 'driver') {
      // Eğer zaten driver panelindeyse yönlendirme yapma (sonsuz döngü önlemi)
      if (!location.pathname.startsWith('/driver')) {
        setHasRedirected(true);
        toast.info(t('driverRedirectMessage') || 'Sürücü hesabınızla giriş yaptınız. Sürücü paneline yönlendiriliyorsunuz.');
        navigate('/driver', { replace: true });
      }
    } else if (checkAgency && role === 'agency') {
      // Eğer zaten agency panelindeyse yönlendirme yapma
      if (!location.pathname.startsWith('/agency')) {
        setHasRedirected(true);
        toast.info(t('agencyRedirectMessage') || 'Acente hesabınızla giriş yaptınız. Acente paneline yönlendiriliyorsunuz.');
        navigate('/agency', { replace: true });
      }
    }
  }, [role, loading, navigate, location, checkDriver, checkAgency, hasRedirected, t]);

  // Bu bileşen görsel bir şey render etmez
  return null;
};
