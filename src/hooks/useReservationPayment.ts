import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  isPaymentsEnabled, 
  type PaymentProvider,
  type PaymentStatus,
} from "@/config/payments";
import { toast } from "sonner";

interface UpdatePaymentStatusOptions {
  reservationId: string;
  status: PaymentStatus;
  partialAmount?: number;
  paymentProvider?: PaymentProvider;
}

interface PaymentInfo {
  status: PaymentStatus;
  partialAmount: number | null;
  paymentProvider: string | null;
  paymentLink: string | null;
  paymentCompletedAt: string | null;
}

// Cache for payment info to reduce API calls
const paymentInfoCache = new Map<string, { data: PaymentInfo; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export const useReservationPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();

  // Memoize access check
  const canAccessPayments = useMemo(() => {
    if (!user) return false;
    return role === 'customer' || role === 'agency' || role === 'admin';
  }, [user, role]);

  // Get payment info with caching
  const getPaymentInfo = useCallback(async (
    reservationId: string, 
    bypassCache = false
  ): Promise<PaymentInfo | null> => {
    // Check cache first
    if (!bypassCache) {
      const cached = paymentInfoCache.get(reservationId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('payment_status, partial_amount, payment_provider, payment_link, payment_completed_at')
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      const paymentInfo: PaymentInfo = {
        status: (data.payment_status || 'pending') as PaymentStatus,
        partialAmount: data.partial_amount,
        paymentProvider: data.payment_provider,
        paymentLink: data.payment_link,
        paymentCompletedAt: data.payment_completed_at,
      };

      // Update cache
      paymentInfoCache.set(reservationId, {
        data: paymentInfo,
        timestamp: Date.now(),
      });

      return paymentInfo;
    } catch (error) {
      console.error('Error fetching payment info:', error);
      return null;
    }
  }, []);

  // Invalidate cache for a reservation
  const invalidateCache = useCallback((reservationId: string) => {
    paymentInfoCache.delete(reservationId);
  }, []);

  // Update payment status with optimistic updates
  const updatePaymentStatus = useCallback(async ({
    reservationId,
    status,
    partialAmount,
    paymentProvider,
  }: UpdatePaymentStatusOptions): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to update payment status");
      return false;
    }

    setIsLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        payment_status: status,
        updated_at: new Date().toISOString(),
      };

      if (partialAmount !== undefined) {
        updateData.partial_amount = partialAmount;
      }

      if (paymentProvider) {
        updateData.payment_provider = paymentProvider;
      }

      if (status === 'paid') {
        updateData.payment_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId);

      if (error) throw error;

      // Invalidate cache after successful update
      invalidateCache(reservationId);

      toast.success("Payment status updated");
      return true;
    } catch (error: unknown) {
      console.error('Error updating payment status:', error);
      toast.error("Failed to update payment status");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, invalidateCache]);

  // Mark reservation for "pay on transfer" (cash to driver)
  const markPayOnTransfer = useCallback(async (reservationId: string): Promise<boolean> => {
    return updatePaymentStatus({
      reservationId,
      status: 'pay_on_transfer',
    });
  }, [updatePaymentStatus]);

  // Record partial payment
  const recordPartialPayment = useCallback(async (
    reservationId: string,
    amount: number,
    provider?: PaymentProvider
  ): Promise<boolean> => {
    if (amount <= 0) {
      toast.error("Partial amount must be greater than 0");
      return false;
    }
    
    return updatePaymentStatus({
      reservationId,
      status: 'partial',
      partialAmount: amount,
      paymentProvider: provider,
    });
  }, [updatePaymentStatus]);

  // Mark as fully paid
  const markAsPaid = useCallback(async (
    reservationId: string,
    provider?: PaymentProvider
  ): Promise<boolean> => {
    return updatePaymentStatus({
      reservationId,
      status: 'paid',
      paymentProvider: provider,
    });
  }, [updatePaymentStatus]);

  // Reset payment status back to pending
  const resetPaymentStatus = useCallback(async (reservationId: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    // Only admin can reset payment status
    if (role !== 'admin') {
      toast.error("Only administrators can reset payment status");
      return false;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          payment_status: 'pending',
          partial_amount: null,
          payment_provider: null,
          payment_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (error) throw error;

      invalidateCache(reservationId);
      toast.success("Payment status reset to pending");
      return true;
    } catch (error) {
      console.error('Error resetting payment status:', error);
      toast.error("Failed to reset payment status");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, role, invalidateCache]);

  return {
    isLoading,
    isPaymentsEnabled: isPaymentsEnabled(),
    canAccessPayments,
    getPaymentInfo,
    invalidateCache,
    updatePaymentStatus,
    markPayOnTransfer,
    recordPartialPayment,
    markAsPaid,
    resetPaymentStatus,
  };
};
