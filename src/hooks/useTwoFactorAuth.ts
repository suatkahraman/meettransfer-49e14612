import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TwoFactorState {
  isPending: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
}

// Generate a simple device fingerprint based on available browser data
const generateDeviceFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    navigator.hardwareConcurrency?.toString() || '0',
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Get device name for display
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux Device';
  return 'Unknown Device';
};

export const useTwoFactorAuth = () => {
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isPending: false,
    userId: null,
    email: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceFingerprint] = useState(() => generateDeviceFingerprint());

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
          deviceName: getDeviceName(),
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
  }, [deviceFingerprint]);

  const initiate2FA = useCallback(async (userId: string, email: string, role: string, language: string = 'tr') => {
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
      });

      return { success: true };
    } catch (err: any) {
      console.error('2FA initiation error:', err);
      setError(err.message || 'Failed to send verification code');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (otpCode: string) => {
    if (!twoFactorState.userId) {
      setError('No pending 2FA verification');
      return { success: false, error: 'no_pending' };
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
        const errorMessage = data?.error === 'expired' 
          ? 'Kod süresi dolmuş. Yeni kod gönderilsin mi?' 
          : 'Geçersiz doğrulama kodu';
        setError(errorMessage);
        return { success: false, error: data?.error || 'invalid' };
      }

      // Register this device as trusted after successful verification
      await registerTrustedDevice(twoFactorState.userId);

      // Reset state on success
      setTwoFactorState({
        isPending: false,
        userId: null,
        email: null,
        role: null,
      });

      return { success: true };
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(err.message || 'Verification failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [twoFactorState.userId, registerTrustedDevice]);

  const resendOTP = useCallback(async () => {
    if (!twoFactorState.userId || !twoFactorState.email || !twoFactorState.role) {
      setError('No pending 2FA verification');
      return { success: false };
    }

    return initiate2FA(
      twoFactorState.userId,
      twoFactorState.email,
      twoFactorState.role
    );
  }, [twoFactorState, initiate2FA]);

  const cancel2FA = useCallback(() => {
    setTwoFactorState({
      isPending: false,
      userId: null,
      email: null,
      role: null,
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
  };
};
