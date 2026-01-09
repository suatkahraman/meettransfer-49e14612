import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Mail, RefreshCw, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

interface TwoFactorVerificationProps {
  email: string;
  role: string;
  isLoading: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onCancel: () => void;
}

const TwoFactorVerification = ({
  email,
  role,
  isLoading,
  error,
  onVerify,
  onResend,
  onCancel,
}: TwoFactorVerificationProps) => {
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const isTurkish = language === 'TR';

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6) {
      onVerify(otpCode);
    }
  }, [otpCode, onVerify]);

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setOtpCode('');
    onResend();
  };

  const getRoleLabel = () => {
    const labels: Record<string, Record<Language, string>> = {
      admin: { TR: 'Admin', EN: 'Admin', DE: 'Admin', FR: 'Admin', RU: 'Админ', IT: 'Admin', ES: 'Admin', AR: 'مشرف', UK: 'Адмін', JA: '管理者' },
      agency: { TR: 'Acenta', EN: 'Agency', DE: 'Agentur', FR: 'Agence', RU: 'Агентство', IT: 'Agenzia', ES: 'Agencia', AR: 'وكالة', UK: 'Агентство', JA: '代理店' },
      driver: { TR: 'Şoför', EN: 'Driver', DE: 'Fahrer', FR: 'Chauffeur', RU: 'Водитель', IT: 'Autista', ES: 'Conductor', AR: 'سائق', UK: 'Водій', JA: 'ドライバー' },
    };
    return labels[role]?.[language] || role;
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2">
          <ShieldCheck className="h-8 w-8 text-accent" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-serif">
          {isTurkish ? 'İki Faktörlü Doğrulama' : 'Two-Factor Authentication'}
        </CardTitle>
        <CardDescription className="text-base">
          {isTurkish 
            ? `${getRoleLabel()} paneline giriş için email adresinize gönderilen 6 haneli kodu girin.`
            : `Enter the 6-digit code sent to your email to access the ${getRoleLabel()} panel.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email indicator */}
        <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{maskedEmail}</span>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Timer and resend */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {!canResend ? (
            <>
              <Clock className="h-4 w-4" />
              <span>
                {isTurkish 
                  ? `${countdown} saniye sonra yeniden gönder` 
                  : `Resend in ${countdown} seconds`}
              </span>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isLoading}
              className="text-accent hover:text-accent/80"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isTurkish ? 'Yeni kod gönder' : 'Resend code'}
            </Button>
          )}
        </div>

        {/* Verify button */}
        <Button
          variant="accent"
          className="w-full h-12 rounded-xl text-base font-medium"
          onClick={() => onVerify(otpCode)}
          disabled={isLoading || otpCode.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isTurkish ? 'Doğrulanıyor...' : 'Verifying...'}
            </>
          ) : (
            isTurkish ? 'Doğrula' : 'Verify'
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
          {isTurkish ? 'Giriş ekranına dön' : 'Back to login'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TwoFactorVerification;
