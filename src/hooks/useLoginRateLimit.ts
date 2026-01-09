import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitStatus {
  locked: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
  failedAttempts?: number;
}

interface RateLimitResponse {
  locked: boolean;
  remaining_seconds?: number;
  remaining_attempts?: number;
  failed_attempts?: number;
}

export const useLoginRateLimit = () => {
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({ locked: false });
  const [checking, setChecking] = useState(false);

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitStatus> => {
    if (!email) return { locked: false };
    
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_email: email.toLowerCase(),
        p_ip_address: null
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return { locked: false };
      }

      const response = data as unknown as RateLimitResponse;
      const status: RateLimitStatus = {
        locked: response?.locked || false,
        remainingSeconds: response?.remaining_seconds,
        remainingAttempts: response?.remaining_attempts,
        failedAttempts: response?.failed_attempts
      };

      setRateLimitStatus(status);
      return status;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return { locked: false };
    } finally {
      setChecking(false);
    }
  }, []);

  const logLoginAttempt = useCallback(async (
    email: string,
    success: boolean,
    failureReason?: string,
    userId?: string,
    role?: string
  ) => {
    try {
      await supabase.rpc('log_login_attempt', {
        p_email: email.toLowerCase(),
        p_success: success,
        p_failure_reason: failureReason || null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_user_id: userId || null,
        p_role: role || null
      });
    } catch (err) {
      console.error('Failed to log login attempt:', err);
    }
  }, []);

  const formatLockoutTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes} dakika ${remainingSeconds} saniye`;
    }
    return `${remainingSeconds} saniye`;
  }, []);

  return {
    rateLimitStatus,
    checking,
    checkRateLimit,
    logLoginAttempt,
    formatLockoutTime
  };
};
