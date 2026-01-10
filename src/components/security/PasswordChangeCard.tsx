import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  Loader2,
  KeyRound,
  Mail,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  LogOut,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

// Constants
const COOLDOWN_STORAGE_KEY = 'password_reset_cooldown';
const COOLDOWN_DURATION = 60; // seconds
const MAX_ATTEMPTS_PER_HOUR = 3;
const PASSWORD_CHANGE_HISTORY_KEY = 'last_password_change';

interface PasswordChangeCardProps {
  isTurkish: boolean;
}

// Memoized requirement item component
const RequirementItem = memo(({ met, label }: { met: boolean; label: string }) => (
  <motion.div 
    className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
      met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
    }`}
    initial={{ opacity: 0, x: -5 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
    </motion.div>
    <span>{label}</span>
  </motion.div>
));

RequirementItem.displayName = 'RequirementItem';

// Password match indicator
const PasswordMatchIndicator = memo(({ 
  match, 
  hasConfirm, 
  matchLabel, 
  noMatchLabel 
}: { 
  match: boolean; 
  hasConfirm: boolean;
  matchLabel: string;
  noMatchLabel: string;
}) => {
  if (!hasConfirm) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-1.5 text-xs ${
        match ? 'text-green-600 dark:text-green-400' : 'text-destructive'
      }`}
    >
      {match ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{match ? matchLabel : noMatchLabel}</span>
    </motion.div>
  );
});

PasswordMatchIndicator.displayName = 'PasswordMatchIndicator';

const PasswordChangeCard = ({ isTurkish }: PasswordChangeCardProps) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailCooldown, setResetEmailCooldown] = useState(0);
  const [signOutOtherSessions, setSignOutOtherSessions] = useState(true);
  const [lastPasswordChange, setLastPasswordChange] = useState<Date | null>(null);
  const [changeSuccess, setChangeSuccess] = useState(false);

  // Password validation schema with zod
  const passwordSchema = useMemo(() => z.string()
    .min(8, isTurkish ? 'En az 8 karakter gerekli' : 'At least 8 characters required')
    .regex(/[A-Z]/, isTurkish ? 'Büyük harf gerekli' : 'Uppercase letter required')
    .regex(/[a-z]/, isTurkish ? 'Küçük harf gerekli' : 'Lowercase letter required')
    .regex(/[0-9]/, isTurkish ? 'Rakam gerekli' : 'Number required'), 
  [isTurkish]);

  const t = useMemo(() => ({
    title: isTurkish ? 'Şifre Değiştir' : 'Change Password',
    description: isTurkish 
      ? 'Hesabınızın güvenliği için güçlü bir şifre kullanın' 
      : 'Use a strong password to protect your account',
    currentPassword: isTurkish ? 'Mevcut Şifre' : 'Current Password',
    newPassword: isTurkish ? 'Yeni Şifre' : 'New Password',
    confirmPassword: isTurkish ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password',
    changePassword: isTurkish ? 'Şifreyi Değiştir' : 'Change Password',
    changing: isTurkish ? 'Değiştiriliyor...' : 'Changing...',
    success: isTurkish ? 'Şifreniz başarıyla değiştirildi!' : 'Your password has been changed successfully!',
    error: isTurkish ? 'Şifre değiştirilemedi' : 'Failed to change password',
    wrongPassword: isTurkish ? 'Mevcut şifre yanlış' : 'Current password is incorrect',
    passwordsNoMatch: isTurkish ? 'Şifreler eşleşmiyor' : 'Passwords do not match',
    passwordsMatch: isTurkish ? 'Şifreler eşleşiyor' : 'Passwords match',
    cancel: isTurkish ? 'İptal' : 'Cancel',
    // Password strength
    strength: isTurkish ? 'Şifre Gücü' : 'Password Strength',
    weak: isTurkish ? 'Zayıf' : 'Weak',
    fair: isTurkish ? 'Orta' : 'Fair',
    good: isTurkish ? 'İyi' : 'Good',
    strong: isTurkish ? 'Güçlü' : 'Strong',
    excellent: isTurkish ? 'Mükemmel' : 'Excellent',
    // Requirements
    minLength: isTurkish ? 'En az 8 karakter' : 'At least 8 characters',
    hasUppercase: isTurkish ? 'Büyük harf içermeli' : 'Contains uppercase letter',
    hasLowercase: isTurkish ? 'Küçük harf içermeli' : 'Contains lowercase letter',
    hasNumber: isTurkish ? 'Rakam içermeli' : 'Contains number',
    hasSpecial: isTurkish ? 'Özel karakter içermeli (!@#$%...)' : 'Contains special character (!@#$%...)',
    // Reset email
    forgotPassword: isTurkish ? 'Şifremi Unuttum' : 'Forgot Password',
    sendResetEmail: isTurkish ? 'Sıfırlama E-postası Gönder' : 'Send Reset Email',
    sendingResetEmail: isTurkish ? 'Gönderiliyor...' : 'Sending...',
    resetEmailSent: isTurkish ? 'Sıfırlama e-postası gönderildi!' : 'Reset email sent!',
    resetEmailSentDesc: isTurkish 
      ? 'E-posta adresinize bir şifre sıfırlama bağlantısı gönderdik. Lütfen gelen kutunuzu kontrol edin.' 
      : 'We\'ve sent a password reset link to your email. Please check your inbox.',
    resetEmailError: isTurkish ? 'E-posta gönderilemedi' : 'Failed to send email',
    or: isTurkish ? 'veya' : 'or',
    resendIn: (seconds: number) => isTurkish 
      ? `${seconds} saniye sonra tekrar gönder` 
      : `Resend in ${seconds} seconds`,
    checkSpam: isTurkish 
      ? 'Spam klasörünüzü de kontrol etmeyi unutmayın' 
      : 'Don\'t forget to check your spam folder',
    tooManyAttempts: isTurkish
      ? 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.'
      : 'Too many attempts. Please try again later.',
    tryAgainIn: (minutes: number) => isTurkish
      ? `${minutes} dakika sonra tekrar deneyebilirsiniz`
      : `You can try again in ${minutes} minutes`,
    // Session management
    signOutOtherSessions: isTurkish ? 'Diğer oturumları kapat' : 'Sign out other sessions',
    signOutOtherSessionsDesc: isTurkish 
      ? 'Şifre değişikliğinden sonra diğer cihazlardaki oturumlarınızı kapatın' 
      : 'Sign out from all other devices after password change',
    // Last change
    lastChanged: isTurkish ? 'Son değişiklik' : 'Last changed',
    never: isTurkish ? 'Hiç değiştirilmedi' : 'Never changed',
    justNow: isTurkish ? 'Az önce' : 'Just now',
    daysAgo: (days: number) => isTurkish 
      ? `${days} gün önce` 
      : `${days} days ago`,
    // Success
    allSessionsSignedOut: isTurkish 
      ? 'Diğer tüm oturumlar kapatıldı' 
      : 'All other sessions have been signed out',
    // Same password error
    samePassword: isTurkish 
      ? 'Yeni şifre mevcut şifreden farklı olmalıdır' 
      : 'New password must be different from current password',
  }), [isTurkish]);

  // Load last password change date
  useEffect(() => {
    const stored = localStorage.getItem(PASSWORD_CHANGE_HISTORY_KEY);
    if (stored) {
      setLastPasswordChange(new Date(stored));
    }
  }, []);

  // Initialize cooldown from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (stored) {
      try {
        const { timestamp, email } = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - timestamp) / 1000);
        const remaining = COOLDOWN_DURATION - elapsed;
        
        if (remaining > 0 && email === user?.email) {
          setResetEmailCooldown(remaining);
          setResetEmailSent(true);
        } else {
          localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      }
    }
  }, [user?.email]);

  // Cooldown timer effect
  useEffect(() => {
    if (resetEmailCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResetEmailCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resetEmailCooldown > 0]);

  // Check rate limiting
  const checkRateLimit = useCallback((): boolean => {
    try {
      const attempts = JSON.parse(localStorage.getItem('reset_email_attempts') || '[]') as number[];
      const oneHourAgo = Date.now() - 3600000;
      const recentAttempts = attempts.filter(ts => ts > oneHourAgo);
      
      if (recentAttempts.length >= MAX_ATTEMPTS_PER_HOUR) {
        const oldestAttempt = Math.min(...recentAttempts);
        const waitMinutes = Math.ceil((oldestAttempt + 3600000 - Date.now()) / 60000);
        toast.error(t.tooManyAttempts, {
          description: t.tryAgainIn(waitMinutes)
        });
        return false;
      }
      
      return true;
    } catch {
      return true;
    }
  }, [t]);

  // Record attempt for rate limiting
  const recordAttempt = useCallback(() => {
    try {
      const attempts = JSON.parse(localStorage.getItem('reset_email_attempts') || '[]') as number[];
      const oneHourAgo = Date.now() - 3600000;
      const recentAttempts = attempts.filter(ts => ts > oneHourAgo);
      recentAttempts.push(Date.now());
      localStorage.setItem('reset_email_attempts', JSON.stringify(recentAttempts));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Password strength calculation with enhanced scoring
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '', checks: {} as Record<string, boolean> };

    const checks = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/`~]/.test(newPassword),
    };

    // Enhanced scoring
    let score = 0;
    if (checks.minLength) score += 15;
    if (checks.hasUppercase) score += 20;
    if (checks.hasLowercase) score += 15;
    if (checks.hasNumber) score += 20;
    if (checks.hasSpecial) score += 20;
    
    // Bonus for length
    if (newPassword.length >= 12) score += 5;
    if (newPassword.length >= 16) score += 5;

    let label = t.weak;
    let color = 'bg-destructive';

    if (score >= 95) {
      label = t.excellent;
      color = 'bg-emerald-500';
    } else if (score >= 80) {
      label = t.strong;
      color = 'bg-green-500';
    } else if (score >= 60) {
      label = t.good;
      color = 'bg-primary';
    } else if (score >= 40) {
      label = t.fair;
      color = 'bg-amber-500';
    }

    return { score: Math.min(score, 100), label, color, checks };
  }, [newPassword, t]);

  // Form validation
  const isFormValid = useMemo(() => {
    const zodResult = passwordSchema.safeParse(newPassword);
    return (
      currentPassword.length > 0 &&
      zodResult.success &&
      confirmPassword === newPassword &&
      passwordStrength.score >= 60 &&
      currentPassword !== newPassword // Prevent same password
    );
  }, [currentPassword, newPassword, confirmPassword, passwordStrength.score, passwordSchema]);

  // Check if trying to use same password
  const isSamePassword = useMemo(() => {
    return currentPassword.length > 0 && newPassword.length > 0 && currentPassword === newPassword;
  }, [currentPassword, newPassword]);

  // Format last change date
  const formattedLastChange = useMemo(() => {
    if (!lastPasswordChange) return t.never;
    
    const now = new Date();
    const diff = now.getTime() - lastPasswordChange.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return t.justNow;
    return t.daysAgo(days);
  }, [lastPasswordChange, t]);

  const handleSendResetEmail = useCallback(async () => {
    if (!user?.email || resetEmailCooldown > 0 || isSendingResetEmail) return;

    if (!checkRateLimit()) return;

    setIsSendingResetEmail(true);
    
    try {
      const redirectUrl = `${window.location.origin}/auth?type=recovery`;
      
      console.log('Sending password reset email to:', user.email);

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Reset email API error:', error);
        throw error;
      }

      recordAttempt();

      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        email: user.email
      }));

      setResetEmailSent(true);
      setResetEmailCooldown(COOLDOWN_DURATION);
      
      toast.success(t.resetEmailSent, {
        description: t.checkSpam,
        duration: 5000
      });
      
    } catch (error: any) {
      console.error('Reset email error:', error);
      
      if (error.message?.includes('rate limit')) {
        toast.error(t.tooManyAttempts);
      } else if (error.message?.includes('not found')) {
        setResetEmailSent(true);
        setResetEmailCooldown(COOLDOWN_DURATION);
        toast.success(t.resetEmailSent);
      } else {
        toast.error(t.resetEmailError, {
          description: error.message
        });
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  }, [user?.email, resetEmailCooldown, isSendingResetEmail, checkRateLimit, recordAttempt, t]);

  const handleChangePassword = useCallback(async () => {
    if (!isFormValid || isChanging) return;

    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsNoMatch);
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t.samePassword);
      return;
    }

    setIsChanging(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        throw new Error('User not found');
      }

      console.log('Verifying current password...');

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('Current password verification failed:', signInError);
        toast.error(t.wrongPassword);
        setIsChanging(false);
        return;
      }

      console.log('Current password verified, updating to new password...');

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      // Sign out other sessions if requested
      if (signOutOtherSessions) {
        console.log('Signing out other sessions...');
        // Note: This signs out the current session too, so we need to re-authenticate
        await supabase.auth.signOut({ scope: 'others' });
      }

      // Save last password change date
      const now = new Date();
      localStorage.setItem(PASSWORD_CHANGE_HISTORY_KEY, now.toISOString());
      setLastPasswordChange(now);

      console.log('Password updated successfully');
      
      setChangeSuccess(true);
      
      toast.success(t.success, {
        description: signOutOtherSessions ? t.allSessionsSignedOut : undefined,
        duration: 5000
      });
      
      // Reset form after showing success
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsExpanded(false);
        setChangeSuccess(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t.error);
    } finally {
      setIsChanging(false);
    }
  }, [isFormValid, isChanging, currentPassword, newPassword, confirmPassword, signOutOtherSessions, t]);

  const handleCancel = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsExpanded(false);
    setResetEmailSent(false);
    setChangeSuccess(false);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span>{t.description}</span>
              {lastPasswordChange && (
                <Badge variant="outline" className="text-xs w-fit">
                  <Clock className="h-3 w-3 mr-1" />
                  {t.lastChanged}: {formattedLastChange}
                </Badge>
              )}
            </CardDescription>
          </div>
          {!isExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="shrink-0"
            >
              <Lock className="h-4 w-4 mr-2" />
              {t.changePassword}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className="space-y-4 pt-0">
              {/* Success State */}
              {changeSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                  >
                    <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {t.success}
                  </h3>
                  {signOutOtherSessions && (
                    <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-2">
                      {t.allSessionsSignedOut}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Reset Email Sent Success */}
              {resetEmailSent && !changeSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-700 dark:text-green-300">
                        {t.resetEmailSent}
                      </p>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                        {t.resetEmailSentDesc}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {t.checkSpam}
                      </p>
                      {resetEmailCooldown > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
                          <p className="text-xs text-muted-foreground">
                            {t.resendIn(resetEmailCooldown)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Main Form */}
              {!changeSuccess && (
                <>
                  {/* Forgot Password Button */}
                  {!resetEmailSent && user?.email && (
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        onClick={handleSendResetEmail}
                        disabled={isSendingResetEmail || resetEmailCooldown > 0}
                        className="w-full"
                      >
                        {isSendingResetEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t.sendingResetEmail}
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            {resetEmailCooldown > 0 
                              ? t.resendIn(resetEmailCooldown) 
                              : t.sendResetEmail
                            }
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {user.email}
                      </p>
                    </div>
                  )}

                  {/* Separator */}
                  {!resetEmailSent && (
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
                      </div>
                    </div>
                  )}

                  {/* Direct Password Change Form */}
                  {!resetEmailSent && (
                    <>
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="current-password">{t.currentPassword}</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="pr-10"
                            autoComplete="current-password"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="new-password">{t.newPassword}</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`pr-10 ${isSamePassword ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                            autoComplete="new-password"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Same password warning */}
                        {isSamePassword && (
                          <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {t.samePassword}
                          </motion.p>
                        )}

                        {/* Password Strength */}
                        {newPassword && !isSamePassword && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{t.strength}</span>
                              <span className={`font-medium flex items-center gap-1 ${
                                passwordStrength.score >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                                passwordStrength.score >= 80 ? 'text-green-600 dark:text-green-400' :
                                passwordStrength.score >= 60 ? 'text-primary' :
                                passwordStrength.score >= 40 ? 'text-amber-600 dark:text-amber-400' :
                                'text-destructive'
                              }`}>
                                {passwordStrength.score >= 95 && <Sparkles className="h-3 w-3" />}
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${passwordStrength.color} transition-colors duration-300`}
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordStrength.score}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                              />
                            </div>

                            {/* Requirements */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              <RequirementItem met={passwordStrength.checks?.minLength || false} label={t.minLength} />
                              <RequirementItem met={passwordStrength.checks?.hasUppercase || false} label={t.hasUppercase} />
                              <RequirementItem met={passwordStrength.checks?.hasLowercase || false} label={t.hasLowercase} />
                              <RequirementItem met={passwordStrength.checks?.hasNumber || false} label={t.hasNumber} />
                              <RequirementItem met={passwordStrength.checks?.hasSpecial || false} label={t.hasSpecial} />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`pr-10 transition-colors ${
                              confirmPassword && confirmPassword !== newPassword 
                                ? 'border-destructive focus-visible:ring-destructive' 
                                : confirmPassword && confirmPassword === newPassword
                                ? 'border-green-500 focus-visible:ring-green-500'
                                : ''
                            }`}
                            autoComplete="new-password"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordMatchIndicator 
                          match={confirmPassword === newPassword}
                          hasConfirm={confirmPassword.length > 0}
                          matchLabel={t.passwordsMatch}
                          noMatchLabel={t.passwordsNoMatch}
                        />
                      </div>

                      {/* Sign out other sessions toggle */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <LogOut className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{t.signOutOtherSessions}</p>
                            <p className="text-xs text-muted-foreground">{t.signOutOtherSessionsDesc}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={signOutOtherSessions}
                          onCheckedChange={setSignOutOtherSessions}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isChanging}
                          className="flex-1"
                        >
                          {t.cancel}
                        </Button>
                        <Button
                          onClick={handleChangePassword}
                          disabled={!isFormValid || isChanging}
                          className="flex-1"
                        >
                          {isChanging ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t.changing}
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              {t.changePassword}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Back Button after Reset Email Sent */}
                  {resetEmailSent && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="w-full"
                    >
                      {t.cancel}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default PasswordChangeCard;
