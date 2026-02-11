import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  User,
  Settings,
  Edit2,
  Save,
  X,
  Phone,
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

  return (
    <>
      <SheetHeader className="p-4 border-b text-left">
        <SheetTitle className="text-lg font-serif flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('settingsTitle')}
        </SheetTitle>
      </SheetHeader>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Kısa yollar */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {t('quickActions') || (language === 'TR' ? 'Kısayollar' : 'Shortcuts')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNav('/')}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <Home className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{t('homeBtn')}</span>
            </button>
            <button
              onClick={() => handleNav('/customer/payments')}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
            >
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-medium">{t('paymentsLabel') || 'Ödemeler'}</span>
            </button>
            <button
              onClick={() => {
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(t('helloSupportMsg')), '_blank');
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                window.open(`tel:${EMERGENCY_PHONE}`, '_self');
                onOpenChange(false);
              }}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors"
            >
              <PhoneCall className="h-5 w-5 text-red-500" />
              <span className="text-xs font-medium">{t('emergencyBtn')}</span>
            </button>
            <button
              onClick={() => handleNav('/security-settings')}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors col-span-2"
            >
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-medium">{t('securityBtn')}</span>
            </button>
          </div>
        </div>

        {/* Profil */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('profileInfoTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!isEditingProfile ? (
              <>
                <p className="text-sm font-medium">{editData.full_name || t('notSpecified')}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {editData.phone || <span className="text-amber-600">{t('pleaseAdd')}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(true)} className="gap-1">
                  <Edit2 className="h-3 w-3" />
                  {t('editBtn')}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs">{t('fullNameLabel')}</Label>
                  <Input
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('phoneLabel')}</Label>
                  <PhoneInput value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="gap-1">
                    {isSaving ? null : <Save className="h-3 w-3" />}
                    {t('save')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <NotificationSettingsPanel language={language === 'TR' ? 'TR' : 'EN'} />

        {/* Profile & Security */}
        <div className="space-y-1 border-t pt-4">
          <button
            onClick={() => handleNav('/customer/profile')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <User className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('editProfile')}</span>
          </button>
          <button
            onClick={() => handleNav('/security-settings')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Shield className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('securitySettingsMenu')}</span>
          </button>
          <div className="px-3 py-2 flex items-center gap-3">
            <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
            <UniversalLanguageSelector variant="compact" />
          </div>
          <button
            onClick={() => {
              signOut();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="font-medium">{t('logoutBtn')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
