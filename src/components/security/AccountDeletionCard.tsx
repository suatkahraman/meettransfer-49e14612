import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  AlertTriangle, 
  ShieldAlert,
  Download,
  FileText,
  UserX,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DataExportItem {
  id: string;
  label: string;
  description: string;
  included: boolean;
}

const AccountDeletionCard = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [acceptedWarnings, setAcceptedWarnings] = useState<string[]>([]);
  const [deletionStep, setDeletionStep] = useState<'info' | 'confirm' | 'processing' | 'success'>('info');
  
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isTurkish = language === 'TR';

  const t = useMemo(() => ({
    title: isTurkish ? 'Hesabı Sil' : 'Delete Account',
    description: isTurkish 
      ? 'Hesabınızı kalıcı olarak silmek için aşağıdaki adımları takip edin. GDPR kapsamında tüm verileriniz silinecektir.'
      : 'Follow the steps below to permanently delete your account. All your data will be deleted in accordance with GDPR.',
    dangerZone: isTurkish ? 'Tehlikeli Bölge' : 'Danger Zone',
    deleteAccount: isTurkish ? 'Hesabımı Sil' : 'Delete My Account',
    deleteWarning: isTurkish 
      ? 'Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.'
      : 'This action cannot be undone. Your account and all data will be permanently deleted.',
    gdprCompliant: isTurkish ? 'GDPR Uyumlu' : 'GDPR Compliant',
    
    // Data Export
    exportData: isTurkish ? 'Verilerimi İndir' : 'Download My Data',
    exportDescription: isTurkish 
      ? 'Silmeden önce tüm verilerinizi indirin (GDPR veri taşınabilirliği hakkı)'
      : 'Download all your data before deletion (GDPR data portability right)',
    exportSuccess: isTurkish ? 'Verileriniz indirildi' : 'Your data has been downloaded',
    
    // Warnings
    warningsTitle: isTurkish ? 'Aşağıdakileri anladığınızı onaylayın:' : 'Please confirm you understand:',
    warning1: isTurkish 
      ? 'Tüm kişisel verilerim (ad, e-posta, telefon) silinecek' 
      : 'All my personal data (name, email, phone) will be deleted',
    warning2: isTurkish 
      ? 'Geçmiş rezervasyonlarım anonimleştirilecek (yasal gereklilikler için)'
      : 'My past reservations will be anonymized (for legal requirements)',
    warning3: isTurkish 
      ? 'Güvenilir cihazlarım ve giriş geçmişim silinecek'
      : 'My trusted devices and login history will be deleted',
    warning4: isTurkish 
      ? 'Bu işlem geri alınamaz'
      : 'This action cannot be undone',
    
    // Confirmation
    confirmTitle: isTurkish ? 'Hesap Silme Onayı' : 'Account Deletion Confirmation',
    confirmDescription: isTurkish 
      ? 'Hesabınızı silmek için lütfen aşağıdaki bilgileri girin.'
      : 'Please enter the following information to delete your account.',
    typeToConfirm: isTurkish ? 'Onaylamak için "SİL" yazın:' : 'Type "DELETE" to confirm:',
    confirmPlaceholder: isTurkish ? 'SİL' : 'DELETE',
    passwordLabel: isTurkish ? 'Şifrenizi girin:' : 'Enter your password:',
    
    // Final Confirmation
    finalTitle: isTurkish ? 'Son Onay' : 'Final Confirmation',
    finalDescription: isTurkish 
      ? 'Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz!'
      : 'Your account and all data will be permanently deleted. This cannot be undone!',
    
    // Buttons
    cancel: isTurkish ? 'İptal' : 'Cancel',
    next: isTurkish ? 'Devam' : 'Continue',
    confirmDelete: isTurkish ? 'Evet, Hesabımı Sil' : 'Yes, Delete My Account',
    
    // Processing
    processingTitle: isTurkish ? 'Hesabınız Siliniyor...' : 'Deleting Your Account...',
    processingStep1: isTurkish ? 'Kişisel veriler siliniyor' : 'Deleting personal data',
    processingStep2: isTurkish ? 'Rezervasyonlar anonimleştiriliyor' : 'Anonymizing reservations',
    processingStep3: isTurkish ? 'Oturum verileri temizleniyor' : 'Clearing session data',
    processingStep4: isTurkish ? 'Hesap kaldırılıyor' : 'Removing account',
    
    // Success/Error
    success: isTurkish ? 'Hesabınız başarıyla silindi' : 'Your account has been deleted successfully',
    error: isTurkish ? 'Hesap silinirken bir hata oluştu' : 'An error occurred while deleting your account',
    invalidPassword: isTurkish ? 'Geçersiz şifre' : 'Invalid password',
    incorrectConfirmText: isTurkish ? 'Lütfen doğru onay metnini girin' : 'Please enter the correct confirmation text',
    
    // Data items
    profileData: isTurkish ? 'Profil Bilgileri' : 'Profile Information',
    profileDataDesc: isTurkish ? 'Ad, e-posta, telefon numarası' : 'Name, email, phone number',
    reservations: isTurkish ? 'Rezervasyon Geçmişi' : 'Reservation History',
    reservationsDesc: isTurkish ? 'Tüm geçmiş transferleriniz' : 'All your past transfers',
    securityData: isTurkish ? 'Güvenlik Verileri' : 'Security Data',
    securityDataDesc: isTurkish ? 'Güvenilir cihazlar, giriş geçmişi' : 'Trusted devices, login history',
    preferences: isTurkish ? 'Tercihler' : 'Preferences',
    preferencesDesc: isTurkish ? 'Dil, bildirim ayarları' : 'Language, notification settings',
  }), [isTurkish]);

  const confirmWord = isTurkish ? 'SİL' : 'DELETE';

  const dataItems: DataExportItem[] = useMemo(() => [
    { id: 'profile', label: t.profileData, description: t.profileDataDesc, included: true },
    { id: 'reservations', label: t.reservations, description: t.reservationsDesc, included: true },
    { id: 'security', label: t.securityData, description: t.securityDataDesc, included: true },
    { id: 'preferences', label: t.preferences, description: t.preferencesDesc, included: true },
  ], [t]);

  const allWarningsAccepted = acceptedWarnings.length === 4;
  const confirmTextValid = confirmText.toUpperCase() === confirmWord;

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [profileResult, reservationsResult, devicesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('reservations').select('*').eq('customer_id', user.id),
        supabase.from('trusted_devices').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        exportType: 'GDPR Data Export',
        user: {
          id: user.id,
          email: user.email,
          profile: profileResult.data,
        },
        reservations: reservationsResult.data || [],
        trustedDevices: devicesResult.data || [],
        metadata: {
          version: '1.0',
          format: 'JSON',
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meet-transfer-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t.exportSuccess);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t.error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !confirmTextValid || !password) return;
    
    setIsDeleting(true);
    setDeletionStep('processing');
    
    try {
      // Verify password first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (authError) {
        toast.error(t.invalidPassword);
        setDeletionStep('confirm');
        setIsDeleting(false);
        return;
      }

      // Call edge function to delete account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { 
          userId: user.id,
          confirmationText: confirmText,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Deletion failed');
      }

      setDeletionStep('success');
      
      // Wait a moment then sign out and redirect
      setTimeout(async () => {
        await signOut();
        navigate('/');
        toast.success(t.success);
      }, 2000);
      
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.message || t.error);
      setDeletionStep('confirm');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setShowFinalConfirmation(false);
    setConfirmText('');
    setPassword('');
    setAcceptedWarnings([]);
    setDeletionStep('info');
    setIsDeleting(false);
  }, []);

  const toggleWarning = (index: number) => {
    const warningId = `warning-${index}`;
    setAcceptedWarnings(prev => 
      prev.includes(warningId) 
        ? prev.filter(w => w !== warningId)
        : [...prev, warningId]
    );
  };

  const renderProcessingStep = (label: string, index: number, currentStep: number) => (
    <motion.div 
      key={index}
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.5 }}
    >
      {currentStep > index ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : currentStep === index ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-muted" />
      )}
      <span className={currentStep >= index ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </motion.div>
  );

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">{t.dangerZone}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-500/10">
              <ShieldAlert className="h-3 w-3 mr-1" />
              {t.gdprCompliant}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Export Section */}
          <div className="p-4 rounded-lg bg-background border">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{t.exportData}</h4>
                <p className="text-sm text-muted-foreground mb-3">{t.exportDescription}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {dataItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {t.exportData}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delete Account Section */}
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-1">{t.deleteAccount}</h4>
                <p className="text-sm text-muted-foreground mb-4">{t.deleteWarning}</p>
                
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteAccount}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && resetDialog()}>
        <AlertDialogContent className="max-w-md">
          <AnimatePresence mode="wait">
            {deletionStep === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t.confirmTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.warningsTitle}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3 my-4">
                  {[t.warning1, t.warning2, t.warning3, t.warning4].map((warning, i) => (
                    <label 
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox 
                        checked={acceptedWarnings.includes(`warning-${i}`)}
                        onCheckedChange={() => toggleWarning(i)}
                      />
                      <span className="text-sm">{warning}</span>
                    </label>
                  ))}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={resetDialog}>{t.cancel}</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={() => setDeletionStep('confirm')}
                    disabled={!allWarningsAccepted}
                  >
                    {t.next}
                  </Button>
                </AlertDialogFooter>
              </motion.div>
            )}

            {deletionStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-destructive" />
                    {t.confirmTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.confirmDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 my-4">
                  <div className="space-y-2">
                    <Label>{t.typeToConfirm}</Label>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={t.confirmPlaceholder}
                      className="font-mono"
                    />
                    {confirmText && !confirmTextValid && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {t.incorrectConfirmText}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t.passwordLabel}</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={resetDialog}>{t.cancel}</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={() => setShowFinalConfirmation(true)}
                    disabled={!confirmTextValid || !password}
                  >
                    {t.next}
                  </Button>
                </AlertDialogFooter>
              </motion.div>
            )}

            {deletionStep === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 text-destructive animate-spin" />
                  </div>
                  <h3 className="font-semibold text-lg">{t.processingTitle}</h3>
                </div>

                <div className="space-y-4 px-4">
                  {[t.processingStep1, t.processingStep2, t.processingStep3, t.processingStep4].map(
                    (step, i) => renderProcessingStep(step, i, Math.floor(Date.now() / 1000) % 4)
                  )}
                </div>
              </motion.div>
            )}

            {deletionStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t.success}</h3>
                <p className="text-sm text-muted-foreground">
                  {isTurkish ? 'Anasayfaya yönlendiriliyorsunuz...' : 'Redirecting to homepage...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              {t.finalTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {t.finalDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowFinalConfirmation(false);
                handleDeleteAccount();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountDeletionCard;
