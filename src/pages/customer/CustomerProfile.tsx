import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, User, Phone, Mail, CheckCircle, AlertCircle, Sparkles, Shield, History, Star, Award, Bell, BellOff, BellRing } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import meetTransferLogo from '@/assets/meet-transfer-logo-small.webp';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number is too long").regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
});

const CustomerProfile = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  const [originalData, setOriginalData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const translations = {
    EN: {
      title: 'My Profile',
      subtitle: 'Update your personal information',
      fullName: 'Full Name',
      phone: 'Phone Number',
      email: 'Email Address',
      currentEmail: 'Current Email',
      newEmail: 'New Email',
      changeEmail: 'Change Email',
      cancelEmailChange: 'Cancel',
      save: 'Save Changes',
      saving: 'Saving...',
      back: 'Back',
      success: 'Profile updated successfully',
      error: 'Failed to update profile',
      emailChangeSuccess: 'Verification email sent to new address',
      emailChangeError: 'Failed to change email',
      noChanges: 'No changes to save',
      namePlaceholder: 'Enter your full name',
      phonePlaceholder: 'Enter your phone number',
      emailPlaceholder: 'Enter new email address',
      notifications: 'Notifications',
      notificationsDesc: 'Manage your notification preferences',
      pushNotifications: 'Push Notifications',
      pushEnabled: 'Enabled',
      pushDisabled: 'Disabled',
      pushNotSupported: 'Not supported on this device',
      pushDenied: 'Permission denied in browser settings',
      enablePush: 'Enable',
      disablePush: 'Disable',
    },
    TR: {
      title: 'Profilim',
      subtitle: 'Kişisel bilgilerinizi güncelleyin',
      fullName: 'Ad Soyad',
      phone: 'Telefon Numarası',
      email: 'E-posta Adresi',
      currentEmail: 'Mevcut E-posta',
      newEmail: 'Yeni E-posta',
      changeEmail: 'E-posta Değiştir',
      cancelEmailChange: 'İptal',
      save: 'Değişiklikleri Kaydet',
      saving: 'Kaydediliyor...',
      back: 'Geri',
      success: 'Profil başarıyla güncellendi',
      error: 'Profil güncellenemedi',
      emailChangeSuccess: 'Doğrulama e-postası yeni adrese gönderildi',
      emailChangeError: 'E-posta değiştirilemedi',
      noChanges: 'Kaydedilecek değişiklik yok',
      namePlaceholder: 'Adınızı ve soyadınızı girin',
      phonePlaceholder: 'Telefon numaranızı girin',
      emailPlaceholder: 'Yeni e-posta adresinizi girin',
      notifications: 'Bildirimler',
      notificationsDesc: 'Bildirim tercihlerinizi yönetin',
      pushNotifications: 'Anlık Bildirimler',
      pushEnabled: 'Açık',
      pushDisabled: 'Kapalı',
      pushNotSupported: 'Bu cihazda desteklenmiyor',
      pushDenied: 'Tarayıcı ayarlarından izin verilmedi',
      enablePush: 'Aç',
      disablePush: 'Kapat',
    },
    DE: {
      title: 'Mein Profil',
      subtitle: 'Aktualisieren Sie Ihre persönlichen Daten',
      fullName: 'Vollständiger Name',
      phone: 'Telefonnummer',
      email: 'E-Mail-Adresse',
      currentEmail: 'Aktuelle E-Mail',
      newEmail: 'Neue E-Mail',
      changeEmail: 'E-Mail ändern',
      cancelEmailChange: 'Abbrechen',
      save: 'Änderungen speichern',
      saving: 'Speichern...',
      back: 'Zurück',
      success: 'Profil erfolgreich aktualisiert',
      error: 'Profil konnte nicht aktualisiert werden',
      emailChangeSuccess: 'Bestätigungs-E-Mail an neue Adresse gesendet',
      emailChangeError: 'E-Mail konnte nicht geändert werden',
      noChanges: 'Keine Änderungen zum Speichern',
      namePlaceholder: 'Geben Sie Ihren vollständigen Namen ein',
      phonePlaceholder: 'Geben Sie Ihre Telefonnummer ein',
      emailPlaceholder: 'Geben Sie Ihre neue E-Mail-Adresse ein',
      notifications: 'Benachrichtigungen',
      notificationsDesc: 'Verwalten Sie Ihre Benachrichtigungseinstellungen',
      pushNotifications: 'Push-Benachrichtigungen',
      pushEnabled: 'Aktiviert',
      pushDisabled: 'Deaktiviert',
      pushNotSupported: 'Auf diesem Gerät nicht unterstützt',
      pushDenied: 'Berechtigung in den Browsereinstellungen verweigert',
      enablePush: 'Aktivieren',
      disablePush: 'Deaktivieren',
    },
    FR: {
      title: 'Mon Profil',
      subtitle: 'Mettez à jour vos informations personnelles',
      fullName: 'Nom complet',
      phone: 'Numéro de téléphone',
      email: 'Adresse e-mail',
      currentEmail: 'E-mail actuel',
      newEmail: 'Nouvel e-mail',
      changeEmail: 'Changer l\'e-mail',
      cancelEmailChange: 'Annuler',
      save: 'Enregistrer les modifications',
      saving: 'Enregistrement...',
      back: 'Retour',
      success: 'Profil mis à jour avec succès',
      error: 'Échec de la mise à jour du profil',
      emailChangeSuccess: 'E-mail de vérification envoyé à la nouvelle adresse',
      emailChangeError: 'Échec du changement d\'e-mail',
      noChanges: 'Aucune modification à enregistrer',
      namePlaceholder: 'Entrez votre nom complet',
      phonePlaceholder: 'Entrez votre numéro de téléphone',
      emailPlaceholder: 'Entrez votre nouvelle adresse e-mail',
      notifications: 'Notifications',
      notificationsDesc: 'Gérez vos préférences de notification',
      pushNotifications: 'Notifications push',
      pushEnabled: 'Activé',
      pushDisabled: 'Désactivé',
      pushNotSupported: 'Non pris en charge sur cet appareil',
      pushDenied: 'Autorisation refusée dans les paramètres du navigateur',
      enablePush: 'Activer',
      disablePush: 'Désactiver',
    },
    RU: {
      title: 'Мой профиль',
      subtitle: 'Обновите вашу личную информацию',
      fullName: 'Полное имя',
      phone: 'Номер телефона',
      email: 'Электронная почта',
      currentEmail: 'Текущий email',
      newEmail: 'Новый email',
      changeEmail: 'Изменить email',
      cancelEmailChange: 'Отмена',
      save: 'Сохранить изменения',
      saving: 'Сохранение...',
      back: 'Назад',
      success: 'Профиль успешно обновлен',
      error: 'Не удалось обновить профиль',
      emailChangeSuccess: 'Письмо с подтверждением отправлено на новый адрес',
      emailChangeError: 'Не удалось изменить email',
      noChanges: 'Нет изменений для сохранения',
      namePlaceholder: 'Введите ваше полное имя',
      phonePlaceholder: 'Введите ваш номер телефона',
      emailPlaceholder: 'Введите новый адрес электронной почты',
      notifications: 'Уведомления',
      notificationsDesc: 'Управляйте настройками уведомлений',
      pushNotifications: 'Push-уведомления',
      pushEnabled: 'Включено',
      pushDisabled: 'Отключено',
      pushNotSupported: 'Не поддерживается на этом устройстве',
      pushDenied: 'Разрешение отклонено в настройках браузера',
      enablePush: 'Включить',
      disablePush: 'Отключить',
    },
    AR: {
      title: 'ملفي الشخصي',
      subtitle: 'قم بتحديث معلوماتك الشخصية',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      currentEmail: 'البريد الحالي',
      newEmail: 'البريد الجديد',
      changeEmail: 'تغيير البريد',
      cancelEmailChange: 'إلغاء',
      save: 'حفظ التغييرات',
      saving: 'جاري الحفظ...',
      back: 'رجوع',
      success: 'تم تحديث الملف الشخصي بنجاح',
      error: 'فشل في تحديث الملف الشخصي',
      emailChangeSuccess: 'تم إرسال بريد التحقق إلى العنوان الجديد',
      emailChangeError: 'فشل في تغيير البريد الإلكتروني',
      noChanges: 'لا توجد تغييرات للحفظ',
      namePlaceholder: 'أدخل اسمك الكامل',
      phonePlaceholder: 'أدخل رقم هاتفك',
      emailPlaceholder: 'أدخل عنوان بريدك الإلكتروني الجديد',
      notifications: 'الإشعارات',
      notificationsDesc: 'إدارة تفضيلات الإشعارات',
      pushNotifications: 'الإشعارات الفورية',
      pushEnabled: 'مفعل',
      pushDisabled: 'معطل',
      pushNotSupported: 'غير مدعوم على هذا الجهاز',
      pushDenied: 'تم رفض الإذن في إعدادات المتصفح',
      enablePush: 'تفعيل',
      disablePush: 'تعطيل',
    },
  };

  const txt = translations[language as keyof typeof translations] || translations.EN;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        const data = {
          full_name: profile?.full_name || user.user_metadata?.full_name || '',
          phone: profile?.phone || user.user_metadata?.phone || '',
          email: user.email || '',
        };

        setFormData(data);
        setOriginalData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const hasChanges = () => {
    return formData.full_name !== originalData.full_name || 
           formData.phone !== originalData.phone;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    const result = profileSchema.safeParse({
      full_name: formData.full_name,
      phone: formData.phone,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    if (!hasChanges()) {
      toast.info(txt.noChanges);
      return;
    }

    setIsSaving(true);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
        }
      });

      if (metaError) throw metaError;

      setOriginalData({
        ...formData,
      });

      toast.success(txt.success);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(txt.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;

    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(newEmail);
    
    if (!result.success) {
      setErrors({ newEmail: 'Invalid email address' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) throw error;

      toast.success(txt.emailChangeSuccess);
      setEmailChangeRequested(false);
      setNewEmail('');
    } catch (error) {
      console.error('Error changing email:', error);
      toast.error(txt.emailChangeError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Premium Header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto flex items-center justify-between max-w-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/customer')}
              className="rounded-full text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src={meetTransferLogo} 
                alt="Meet Transfer" 
                className="h-9 w-9 rounded-full object-cover border-2 border-primary-foreground/20"
              />
              <span className="text-lg font-serif font-bold">Meet Transfer</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Premium Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(var(--primary),0.1),_transparent_50%)]" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-1">
                    {txt.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">{txt.subtitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      <Award className="h-3 w-3 mr-1" />
                      {language === 'TR' ? 'VIP Müşteri' : 'VIP Customer'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-lg border-border/50 overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{language === 'TR' ? 'Kişisel Bilgiler' : 'Personal Information'}</CardTitle>
                  <CardDescription className="text-xs">{language === 'TR' ? 'Profil detaylarınızı güncelleyin' : 'Update your profile details'}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {txt.fullName}
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={txt.namePlaceholder}
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {txt.phone}
                </Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder={txt.phonePlaceholder}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {txt.email}
                </Label>
                
                {!emailChangeRequested ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.email}
                      disabled
                      className="bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailChangeRequested(true)}
                      className="whitespace-nowrap"
                    >
                      {txt.changeEmail}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {txt.currentEmail}: <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={txt.emailPlaceholder}
                        className={errors.newEmail ? 'border-destructive' : ''}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailChangeRequested(false);
                          setNewEmail('');
                          setErrors({});
                        }}
                      >
                        {txt.cancelEmailChange}
                      </Button>
                    </div>
                    {errors.newEmail && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.newEmail}
                      </p>
                    )}
                    <Button
                      onClick={handleEmailChange}
                      disabled={isSaving || !newEmail.trim()}
                      className="w-full"
                      variant="secondary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {txt.saving}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          {txt.changeEmail}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <AnimatePresence>
                {hasChanges() && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {language === 'TR' ? 'Kaydedilmemiş değişiklikler var' : 'You have unsaved changes'}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {txt.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {txt.save}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-6"
        >
          <Card className="shadow-md border-border/50 overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{txt.notifications}</CardTitle>
                  <CardDescription className="text-xs">{txt.notificationsDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isSubscribed ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {isSubscribed ? (
                      <BellRing className="h-5 w-5 text-green-600" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{txt.pushNotifications}</p>
                    {!isSupported ? (
                      <p className="text-xs text-muted-foreground">{txt.pushNotSupported}</p>
                    ) : permission === 'denied' ? (
                      <p className="text-xs text-destructive">{txt.pushDenied}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {isSubscribed ? txt.pushEnabled : txt.pushDisabled}
                      </p>
                    )}
                  </div>
                </div>
                
                {isSupported && permission !== 'denied' && (
                  <div className="flex items-center gap-2">
                    {pushLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Switch
                        checked={isSubscribed}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            subscribe();
                          } else {
                            unsubscribe();
                          }
                        }}
                        className="data-[state=checked]:bg-green-500"
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Info message for denied permission */}
              {permission === 'denied' && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {language === 'TR' 
                      ? 'Bildirimleri etkinleştirmek için tarayıcı ayarlarından izin vermeniz gerekiyor.'
                      : 'To enable notifications, please allow them in your browser settings.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-6"
        >
          <Card className="shadow-md border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" />
                {language === 'TR' ? 'Hızlı Erişim' : 'Quick Access'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-muted/50"
                onClick={() => navigate('/security-settings')}
              >
                <span className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span>{language === 'TR' ? 'Güvenlik Ayarları' : 'Security Settings'}</span>
                </span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-muted/50"
                onClick={() => navigate('/customer/bookings')}
              >
                <span className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <History className="h-4 w-4 text-green-600" />
                  </div>
                  <span>{language === 'TR' ? 'Rezervasyonlarım' : 'My Bookings'}</span>
                </span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default CustomerProfile;
