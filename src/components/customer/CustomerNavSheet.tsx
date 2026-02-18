import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UniversalLanguageSelector from '@/components/UniversalLanguageSelector';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import {
  Home,
  CreditCard,
  MessageCircle,
  PhoneCall,
  Shield,
  Globe,
  LogOut,
  Edit2,
  Save,
  X,
  Phone,
  ClipboardList,
} from 'lucide-react';
import { WHATSAPP_NUMBER, EMERGENCY_PHONE } from '@/lib/contact';
import { PhoneInput } from '@/components/ui/phone-input';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerNavSheetProps {
  onOpenChange: (open: boolean) => void;
  profileData: { full_name: string; phone: string };
  onProfileUpdate?: (data: { full_name: string; phone: string }) => void;
}

export const CustomerNavSheet = ({
  onOpenChange,
  profileData,
  onProfileUpdate,
}: CustomerNavSheetProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState(profileData);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { setEditData(profileData); }, [profileData.full_name, profileData.phone]);

  const handleNav = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editData.full_name, phone: editData.phone })
        .eq('id', user.id);
      if (error) throw error;
      onProfileUpdate?.(editData);
      setIsEditingProfile(false);
      toast.success(language === 'TR' ? 'Kaydedildi' : 'Saved');
    } catch {
      toast.error(language === 'TR' ? 'Kaydetme başarısız' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const navItem = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors text-left w-full";

  return (
    <>
      <SheetHeader className="p-4 sm:p-5 border-b">
        <SheetTitle className="text-base font-semibold tracking-tight">
          {t('settingsTitle')}
        </SheetTitle>
      </SheetHeader>
      <nav className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Profil - Kompakt */}
        <div className="rounded-lg border bg-muted/30 p-3">
          {!isEditingProfile ? (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{editData.full_name || t('notSpecified')}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  {editData.phone || <span className="text-amber-600">{t('pleaseAdd')}</span>}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(true)} className="shrink-0 h-8 text-xs">
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fullNameLabel')}</Label>
                <Input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('phoneLabel')}</Label>
                <PhoneInput value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} className="mt-1 h-8" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)} className="h-8">
                  <X className="h-3 w-3" />
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="h-8 gap-1">
                  {isSaving ? null : <Save className="h-3 w-3" />}
                  {t('save')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigasyon - Tek liste, sade */}
        <div className="space-y-0.5">
          <button onClick={() => handleNav('/')} className={navItem}>
            <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('homeBtn')}
          </button>
          <button onClick={() => handleNav('/customer/bookings')} className={navItem}>
            <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('myBookingsBtn') || (language === 'TR' ? 'Rezervasyonlarım' : 'My Bookings')}
          </button>
          <button onClick={() => handleNav('/customer/bookings#past-reservations')} className={navItem}>
            <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('pastReservations') || (language === 'TR' ? 'Geçmiş Rezervasyonlar' : 'Past Reservations')}
          </button>
          <button onClick={() => handleNav('/customer/payments')} className={navItem}>
            <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('paymentsLabel') || 'Ödemeler'}
          </button>
          <button
            onClick={() => { window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(t('helloSupportMsg')), '_blank'); onOpenChange(false); }}
            className={navItem}
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            WhatsApp
          </button>
          <button
            onClick={() => { window.open(`tel:${EMERGENCY_PHONE}`, '_self'); onOpenChange(false); }}
            className={navItem}
          >
            <PhoneCall className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('emergencyBtn')}
          </button>
          <button onClick={() => handleNav('/security-settings')} className={navItem}>
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t('securityBtn')}
          </button>
        </div>

        {/* Dil seçimi */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <UniversalLanguageSelector variant="compact" />
        </div>

        {/* Bildirimler */}
        <NotificationSettingsPanel language={language === 'TR' ? 'TR' : 'EN'} />

        {/* Çıkış */}
        <button
          onClick={() => { signOut(); onOpenChange(false); }}
          className={`${navItem} text-destructive hover:bg-destructive/10 mt-2`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {t('logoutBtn')}
        </button>
      </nav>
    </>
  );
};
