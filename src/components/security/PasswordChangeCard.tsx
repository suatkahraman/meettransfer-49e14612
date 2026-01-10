import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  Loader2,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

interface PasswordChangeCardProps {
  isTurkish: boolean;
}

const PasswordChangeCard = ({ isTurkish }: PasswordChangeCardProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    success: isTurkish ? 'Şifreniz başarıyla değiştirildi' : 'Your password has been changed successfully',
    error: isTurkish ? 'Şifre değiştirilemedi' : 'Failed to change password',
    wrongPassword: isTurkish ? 'Mevcut şifre yanlış' : 'Current password is incorrect',
    passwordsNoMatch: isTurkish ? 'Şifreler eşleşmiyor' : 'Passwords do not match',
    cancel: isTurkish ? 'İptal' : 'Cancel',
    // Password strength
    strength: isTurkish ? 'Şifre Gücü' : 'Password Strength',
    weak: isTurkish ? 'Zayıf' : 'Weak',
    fair: isTurkish ? 'Orta' : 'Fair',
    good: isTurkish ? 'İyi' : 'Good',
    strong: isTurkish ? 'Güçlü' : 'Strong',
    // Requirements
    minLength: isTurkish ? 'En az 8 karakter' : 'At least 8 characters',
    hasUppercase: isTurkish ? 'Büyük harf içermeli' : 'Contains uppercase letter',
    hasLowercase: isTurkish ? 'Küçük harf içermeli' : 'Contains lowercase letter',
    hasNumber: isTurkish ? 'Rakam içermeli' : 'Contains number',
    hasSpecial: isTurkish ? 'Özel karakter içermeli' : 'Contains special character',
  }), [isTurkish]);

  // Password validation schema
  const passwordSchema = z.string()
    .min(8, t.minLength)
    .regex(/[A-Z]/, t.hasUppercase)
    .regex(/[a-z]/, t.hasLowercase)
    .regex(/[0-9]/, t.hasNumber);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '' };

    let score = 0;
    const checks = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    if (checks.minLength) score += 20;
    if (checks.hasUppercase) score += 20;
    if (checks.hasLowercase) score += 20;
    if (checks.hasNumber) score += 20;
    if (checks.hasSpecial) score += 20;

    let label = t.weak;
    let color = 'bg-red-500';

    if (score >= 80) {
      label = t.strong;
      color = 'bg-green-500';
    } else if (score >= 60) {
      label = t.good;
      color = 'bg-blue-500';
    } else if (score >= 40) {
      label = t.fair;
      color = 'bg-amber-500';
    }

    return { score, label, color, checks };
  }, [newPassword, t]);

  const isFormValid = useMemo(() => {
    return (
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      confirmPassword === newPassword &&
      passwordStrength.score >= 60
    );
  }, [currentPassword, newPassword, confirmPassword, passwordStrength.score]);

  const handleChangePassword = async () => {
    if (!isFormValid) return;

    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsNoMatch);
      return;
    }

    setIsChanging(true);

    try {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(t.wrongPassword);
        setIsChanging(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success(t.success);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t.error);
    } finally {
      setIsChanging(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsExpanded(false);
  };

  const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          {!isExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
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
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.strength}</span>
                      <span className={`font-medium ${
                        passwordStrength.score >= 80 ? 'text-green-600 dark:text-green-400' :
                        passwordStrength.score >= 60 ? 'text-blue-600 dark:text-blue-400' :
                        passwordStrength.score >= 40 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.score}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-2 gap-1 pt-1">
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
                    className={`pr-10 ${
                      confirmPassword && confirmPassword !== newPassword 
                        ? 'border-red-500 focus-visible:ring-red-500' 
                        : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500">{t.passwordsNoMatch}</p>
                )}
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
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default PasswordChangeCard;
