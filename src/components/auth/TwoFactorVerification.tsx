import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, RefreshCw, ArrowLeft, ShieldCheck, Clock, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TwoFactorVerificationProps {
  email: string;
  role: string;
  isLoading: boolean;
  error: string | null;
  onVerify: (code: string, rememberDevice: boolean) => void;
  onResend: () => void;
  onCancel: () => void;
  maxAttempts?: number;
  remainingAttempts?: number;
  otpLength?: number;
  expiryMinutes?: number;
  trustedDeviceDays?: number;
}

const TwoFactorVerification = ({
  email,
  role,
  isLoading,
  error,
  onVerify,
  onResend,
  onCancel,
  maxAttempts = 5,
  remainingAttempts = 5,
  otpLength = 6,
  expiryMinutes = 5,
  trustedDeviceDays = 30,
}: TwoFactorVerificationProps) => {
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoSubmitted = useRef(false);

  const isTurkish = language === 'TR';

  // Translations
  const t = {
    title: isTurkish ? 'İki Faktörlü Doğrulama' : 'Two-Factor Authentication',
    description: isTurkish 
      ? `${getRoleLabel(role, language)} paneline giriş için email adresinize gönderilen ${otpLength} haneli kodu girin.`
      : `Enter the ${otpLength}-digit code sent to your email to access the ${getRoleLabel(role, language)} panel.`,
    codeSent: isTurkish ? 'Kod gönderildi' : 'Code sent',
    verifying: isTurkish ? 'Doğrulanıyor...' : 'Verifying...',
    verify: isTurkish ? 'Doğrula' : 'Verify',
    resendIn: isTurkish ? 'saniye sonra yeniden gönder' : 'Resend in',
    seconds: isTurkish ? 'saniye' : 'seconds',
    resendCode: isTurkish ? 'Yeni kod gönder' : 'Resend code',
    backToLogin: isTurkish ? 'Giriş ekranına dön' : 'Back to login',
    attemptsRemaining: isTurkish 
      ? `${remainingAttempts} deneme hakkı kaldı` 
      : `${remainingAttempts} attempts remaining`,
    tooManyAttempts: isTurkish 
      ? 'Çok fazla hatalı deneme. Yeni kod isteyin.' 
      : 'Too many failed attempts. Request a new code.',
    rememberDevice: isTurkish 
      ? 'Bu cihazı hatırla' 
      : 'Remember this device',
    rememberDeviceHint: isTurkish 
      ? `${trustedDeviceDays} gün boyunca bu cihazdan 2FA sorulmaz` 
      : `Skip 2FA on this device for ${trustedDeviceDays} days`,
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-submit when all digits entered (only once per code)
  useEffect(() => {
    if (otpCode.length === otpLength && !hasAutoSubmitted.current && !isLoading) {
      hasAutoSubmitted.current = true;
      onVerify(otpCode, rememberDevice);
    }
    if (otpCode.length < otpLength) {
      hasAutoSubmitted.current = false;
    }
  }, [otpCode, onVerify, isLoading, otpLength, rememberDevice]);

  // Focus input on mount and after error
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, error]);

  // Clear OTP on error
  useEffect(() => {
    if (error) {
      setOtpCode('');
      hasAutoSubmitted.current = false;
    }
  }, [error]);

  const handleResend = useCallback(async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    setCountdown(60);
    setCanResend(false);
    setOtpCode('');
    hasAutoSubmitted.current = false;
    
    await onResend();
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setIsResending(false);
  }, [canResend, isResending, onResend]);

  const handleVerify = useCallback(() => {
    if (otpCode.length === otpLength && !isLoading) {
      onVerify(otpCode, rememberDevice);
    }
  }, [otpCode, isLoading, onVerify, otpLength, rememberDevice]);

  // Generate OTP slots dynamically based on otpLength
  const otpSlots = Array.from({ length: otpLength }, (_, i) => i);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  const isLocked = remainingAttempts <= 0;

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2">
        <motion.div 
          className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <ShieldCheck className="h-8 w-8 text-accent" />
        </motion.div>
        <CardTitle className="text-2xl md:text-3xl font-serif">
          {t.title}
        </CardTitle>
        <CardDescription className="text-base">
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email indicator */}
        <motion.div 
          className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">{maskedEmail}</span>
        </motion.div>

        {/* Success message for resend */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg overflow-hidden"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t.codeSent}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Input */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <InputOTP
            maxLength={otpLength}
            value={otpCode}
            onChange={setOtpCode}
            disabled={isLoading || isLocked}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {otpSlots.map((index) => (
                <InputOTPSlot 
                  key={index}
                  index={index} 
                  className={`w-12 h-14 text-xl font-semibold border-2 rounded-lg transition-all ${
                    error ? 'border-destructive animate-shake' : 'border-input focus-within:border-accent'
                  }`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </motion.div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg overflow-hidden"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attempts remaining warning */}
        {!isLocked && remainingAttempts < maxAttempts && remainingAttempts > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-amber-600"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{t.attemptsRemaining}</span>
          </motion.div>
        )}

        {/* Locked message */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
          >
            {t.tooManyAttempts}
          </motion.div>
        )}

        {/* Remember device checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
        >
          <Checkbox
            id="remember-device"
            checked={rememberDevice}
            onCheckedChange={(checked) => setRememberDevice(checked === true)}
            disabled={isLoading || isLocked}
            className="mt-0.5"
          />
          <div className="flex-1 space-y-1">
            <label 
              htmlFor="remember-device" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              {t.rememberDevice}
            </label>
            <p className="text-xs text-muted-foreground">
              {t.rememberDeviceHint}
            </p>
          </div>
        </motion.div>

        {/* Timer and resend with circular progress */}
        <div className="flex flex-col items-center gap-3">
          {!canResend ? (
            <motion.div 
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Circular Progress Timer */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className="text-accent transition-all duration-1000 ease-linear"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown / 60)}`}
                  />
                </svg>
                {/* Countdown number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{countdown}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {t.resendIn}
              </span>
            </motion.div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isLoading || isResending}
              className="text-accent hover:text-accent/80"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t.resendCode}
            </Button>
          )}
        </div>

        {/* Verify button */}
        <Button
          variant="accent"
          className="w-full h-12 rounded-xl text-base font-medium transition-all"
          onClick={handleVerify}
          disabled={isLoading || otpCode.length !== otpLength || isLocked}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.verifying}
            </>
          ) : (
            t.verify
          )}
        </Button>
      </CardContent>

      <CardFooter>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onCancel}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.backToLogin}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper function for role labels
function getRoleLabel(role: string, language: Language): string {
  const labels: Record<string, Record<Language, string>> = {
    admin: { TR: 'Admin', EN: 'Admin', DE: 'Admin', FR: 'Admin', RU: 'Админ', IT: 'Admin', ES: 'Admin', AR: 'مشرف', UK: 'Адмін', JA: '管理者', PT: 'Admin' },
    agency: { TR: 'Acenta', EN: 'Agency', DE: 'Agentur', FR: 'Agence', RU: 'Агентство', IT: 'Agenzia', ES: 'Agencia', AR: 'وكالة', UK: 'Агентство', JA: '代理店', PT: 'Agência' },
    driver: { TR: 'Şoför', EN: 'Driver', DE: 'Fahrer', FR: 'Chauffeur', RU: 'Водитель', IT: 'Autista', ES: 'Conductor', AR: 'سائق', UK: 'Водій', JA: 'ドライバー', PT: 'Motorista' },
    customer: { TR: 'Müşteri', EN: 'Customer', DE: 'Kunde', FR: 'Client', RU: 'Клиент', IT: 'Cliente', ES: 'Cliente', AR: 'عميل', UK: 'Клієнт', JA: '顧客', PT: 'Cliente' },
  };
  return labels[role]?.[language] || role;
}

export default TwoFactorVerification;
