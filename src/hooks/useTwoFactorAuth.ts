import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TwoFactorState {
  isPending: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
}

export const useTwoFactorAuth = () => {
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isPending: false,
    userId: null,
    email: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [twoFactorState.userId]);

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
    initiate2FA,
    verify2FA,
    resendOTP,
    cancel2FA,
  };
};
