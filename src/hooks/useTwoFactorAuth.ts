import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TwoFactorState {
  isPending: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
  attempts: number;
  lastOtpSentAt: number | null;
  errorCode: string | null;
}

interface TwoFactorResult {
  success: boolean;
  error?: string;
  errorCode?: 'expired' | 'invalid' | 'rate_limit' | 'no_pending' | 'network' | 'unknown' | 'blocked';
  attemptsRemaining?: number;
}

// Generate a robust device fingerprint with canvas fingerprinting
const generateDeviceFingerprint = (): string => {
  try {
    const components: string[] = [
      navigator.userAgent || '',
      navigator.language || '',
      navigator.languages?.join(',') || '',
      new Date().getTimezoneOffset().toString(),
      screen.width?.toString() || '',
      screen.height?.toString() || '',
      screen.colorDepth?.toString() || '',
      screen.pixelDepth?.toString() || '',
      navigator.hardwareConcurrency?.toString() || '0',
      navigator.maxTouchPoints?.toString() || '0',
      navigator.platform || '',
      // WebGL renderer hint
      (() => {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl && 'getParameter' in gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
            }
          }
          return '';
        } catch {
          return '';
        }
      })(),
    ];
    
    // FNV-1a hash for better distribution
    const str = components.join('|');
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    
    // Add random component for uniqueness across sessions on same device
    const sessionId = sessionStorage.getItem('device_session_id') || 
                      Math.random().toString(36).substring(2);
    sessionStorage.setItem('device_session_id', sessionId);
    
    return Math.abs(hash).toString(36) + '-' + sessionId.slice(0, 4);
  } catch (e) {
    // Fallback if anything fails
    return 'fallback-' + Date.now().toString(36);
  }
};

// Get detailed device name for display
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  
  // Mobile devices
  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+)/);
    return match ? `iPhone (iOS ${match[1]})` : 'iPhone';
  }
  if (/iPad/.test(ua)) {
    const match = ua.match(/OS (\d+)/);
    return match ? `iPad (iPadOS ${match[1]})` : 'iPad';
  }
  if (/Android/.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    const deviceMatch = ua.match(/;\s*([^;)]+)\s*Build/);
    const device = deviceMatch ? deviceMatch[1].trim().slice(0, 20) : 'Device';
    return match ? `${device} (Android ${match[1]})` : 'Android Device';
  }
  
  // Desktop browsers
  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//.test(ua)) browser = 'Opera';
  
  let os = 'Computer';
  if (/Mac OS X/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  } else if (/Windows NT/.test(ua)) {
    const versions: Record<string, string> = {
      '10.0': 'Windows 10/11',
      '6.3': 'Windows 8.1',
      '6.2': 'Windows 8',
      '6.1': 'Windows 7',
    };
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    os = match ? (versions[match[1]] || 'Windows') : 'Windows';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }
  
  return `${browser} on ${os}`;
};

// OTP resend cooldown in milliseconds (can be overridden by settings)
const DEFAULT_OTP_RESEND_COOLDOWN = 60000; // 60 seconds
const DEFAULT_MAX_VERIFY_ATTEMPTS = 5;
const DEFAULT_OTP_LENGTH = 6;

export const useTwoFactorAuth = () => {
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isPending: false,
    userId: null,
    email: null,
    role: null,
    attempts: 0,
    lastOtpSentAt: null,
    errorCode: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP Settings state (loaded from database)
  const [otpSettings, setOtpSettings] = useState({
    resendCooldownSeconds: 60,
    maxVerifyAttempts: 5,
    otpLength: 6,
    expiryMinutes: 5,
    failedLoginThreshold: 2,
    trustedDeviceDays: 30,
  });
  
  // Memoize device fingerprint to prevent regeneration
  const deviceFingerprint = useMemo(() => generateDeviceFingerprint(), []);
  const deviceName = useMemo(() => getDeviceName(), []);
  
  // Ref to prevent duplicate API calls
  const pendingRequest = useRef<AbortController | null>(null);
  
  // Load OTP settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('otp_settings')
          .select('setting_key, setting_value');
        
        if (error) {
          console.error('Failed to load OTP settings:', error);
          return;
        }
        
        if (data) {
          const settingsMap: Record<string, string> = {};
          data.forEach((s) => {
            settingsMap[s.setting_key] = s.setting_value;
          });
          
          setOtpSettings({
            resendCooldownSeconds: parseInt(settingsMap['resend_cooldown_seconds'] || '60', 10),
            maxVerifyAttempts: parseInt(settingsMap['max_verify_attempts'] || '5', 10),
            otpLength: parseInt(settingsMap['otp_length'] || '6', 10),
            expiryMinutes: parseInt(settingsMap['otp_expiry_minutes'] || '5', 10),
            failedLoginThreshold: parseInt(settingsMap['failed_login_threshold'] || '2', 10),
            trustedDeviceDays: parseInt(settingsMap['trusted_device_days'] || '30', 10),
          });
        }
      } catch (err) {
        console.error('Error loading OTP settings:', err);
      }
    };
    
    loadSettings();
  }, []);

  // Check if device is trusted (2FA not needed)
  const checkTrustedDevice = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('check-trusted-device', {
        body: { userId, deviceFingerprint },
      });

      if (invokeError) {
        console.error('Error checking trusted device:', invokeError);
        return false;
      }

      return data?.trusted === true;
    } catch (err) {
      console.error('Error checking trusted device:', err);
      return false;
    }
  }, [deviceFingerprint]);

  // Register this device as trusted after successful 2FA
  const registerTrustedDevice = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('register-trusted-device', {
        body: { 
          userId, 
          deviceFingerprint,
          deviceName,
        },
      });

      if (invokeError) {
        console.error('Error registering trusted device:', invokeError);
        return false;
      }

      return data?.success === true;
    } catch (err) {
      console.error('Error registering trusted device:', err);
      return false;
    }
  }, [deviceFingerprint, deviceName]);

  // Check if we can resend OTP (cooldown check)
  const canResendOTP = useCallback((): boolean => {
    if (!twoFactorState.lastOtpSentAt) return true;
    const cooldownMs = otpSettings.resendCooldownSeconds * 1000;
    return Date.now() - twoFactorState.lastOtpSentAt >= cooldownMs;
  }, [twoFactorState.lastOtpSentAt, otpSettings.resendCooldownSeconds]);

  // Get remaining cooldown time in seconds
  const getResendCooldown = useCallback((): number => {
    if (!twoFactorState.lastOtpSentAt) return 0;
    const elapsed = Date.now() - twoFactorState.lastOtpSentAt;
    const cooldownMs = otpSettings.resendCooldownSeconds * 1000;
    return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
  }, [twoFactorState.lastOtpSentAt, otpSettings.resendCooldownSeconds]);

  const initiate2FA = useCallback(async (
    userId: string, 
    email: string, 
    role: string, 
    language: string = 'tr'
  ): Promise<TwoFactorResult> => {
    // Cancel any pending request
    if (pendingRequest.current) {
      pendingRequest.current.abort();
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-2fa-otp', {
        body: { userId, email, role, language },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setTwoFactorState({
        isPending: true,
        userId,
        email,
        role,
        attempts: 0,
        lastOtpSentAt: Date.now(),
        errorCode: null,
      });

      return { success: true };
    } catch (err: any) {
      console.error('2FA initiation error:', err);
      const errorMessage = err.message || 'Failed to send verification code';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        errorCode: err.name === 'AbortError' ? 'network' : 'unknown'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (otpCode: string): Promise<TwoFactorResult & { autoLogin?: boolean; email?: string; tokenHash?: string }> => {
    if (!twoFactorState.userId) {
      setError('No pending 2FA verification');
      return { success: false, error: 'no_pending', errorCode: 'no_pending' };
    }

    // Check max attempts
    if (twoFactorState.attempts >= otpSettings.maxVerifyAttempts) {
      setError('Çok fazla hatalı deneme. Yeni kod isteyin.');
      return { 
        success: false, 
        error: 'Çok fazla hatalı deneme',
        errorCode: 'rate_limit'
      };
    }

    // Validate OTP format before sending (dynamic length)
    const otpRegex = new RegExp(`^\\d{${otpSettings.otpLength}}$`);
    if (!otpRegex.test(otpCode)) {
      setError(`Kod ${otpSettings.otpLength} haneli olmalıdır`);
      return { success: false, error: 'invalid_format', errorCode: 'invalid' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-2fa-otp', {
        body: { userId: twoFactorState.userId, otpCode },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.success) {
        // Increment attempts on failure
        setTwoFactorState(prev => ({
          ...prev,
          attempts: prev.attempts + 1,
        }));

        const isExpired = data?.error === 'expired';
        const remainingAttemptsCount = otpSettings.maxVerifyAttempts - twoFactorState.attempts - 1;
        const errorMessage = isExpired 
          ? 'Kod süresi dolmuş. Yeni kod gönderin.' 
          : `Geçersiz kod (${remainingAttemptsCount} deneme kaldı)`;
        
        setError(errorMessage);
        return { 
          success: false, 
          error: errorMessage,
          errorCode: isExpired ? 'expired' : 'invalid'
        };
      }

      // Register this device as trusted after successful verification
      await registerTrustedDevice(twoFactorState.userId);

      // Store data for auto-login
      const userEmail = data.email || twoFactorState.email;
      const tokenHash = data.tokenHash;
      const autoLogin = data.autoLogin;

      // Reset state on success
      setTwoFactorState({
        isPending: false,
        userId: null,
        email: null,
        role: null,
        attempts: 0,
        lastOtpSentAt: null,
        errorCode: null,
      });

      return { 
        success: true,
        autoLogin,
        email: userEmail,
        tokenHash
      };
    } catch (err: any) {
      console.error('2FA verification error:', err);
      const errorMessage = err.message || 'Doğrulama başarısız';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        errorCode: 'network'
      };
    } finally {
      setIsLoading(false);
    }
  }, [twoFactorState.userId, twoFactorState.attempts, twoFactorState.email, registerTrustedDevice, otpSettings.maxVerifyAttempts, otpSettings.otpLength]);

  const resendOTP = useCallback(async (): Promise<TwoFactorResult> => {
    if (!twoFactorState.userId || !twoFactorState.email || !twoFactorState.role) {
      setError('No pending 2FA verification');
      return { success: false, errorCode: 'no_pending' };
    }

    // Check cooldown
    if (!canResendOTP()) {
      const remaining = getResendCooldown();
      setError(`${remaining} saniye bekleyin`);
      return { 
        success: false, 
        error: `${remaining} saniye bekleyin`,
        errorCode: 'rate_limit'
      };
    }

    // Reset attempts when resending
    setTwoFactorState(prev => ({ ...prev, attempts: 0 }));

    return initiate2FA(
      twoFactorState.userId,
      twoFactorState.email,
      twoFactorState.role
    );
  }, [twoFactorState, initiate2FA, canResendOTP, getResendCooldown]);

  const cancel2FA = useCallback(() => {
    // Cancel any pending request
    if (pendingRequest.current) {
      pendingRequest.current.abort();
    }
    
    setTwoFactorState({
      isPending: false,
      userId: null,
      email: null,
      role: null,
      attempts: 0,
      lastOtpSentAt: null,
      errorCode: null,
    });
    setError(null);
  }, []);

  return {
    twoFactorState,
    isLoading,
    error,
    deviceFingerprint,
    initiate2FA,
    verify2FA,
    resendOTP,
    cancel2FA,
    checkTrustedDevice,
    registerTrustedDevice,
    canResendOTP,
    getResendCooldown,
    maxAttempts: otpSettings.maxVerifyAttempts,
    remainingAttempts: otpSettings.maxVerifyAttempts - twoFactorState.attempts,
    otpSettings,
  };
};
