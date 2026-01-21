import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  isPaymentsEnabled, 
  type PaymentProvider,
  type PaymentStatus,
  type SupportedCurrency 
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

export const useReservationPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();

  // Check if current user can access payment options
  const canAccessPayments = useCallback((): boolean => {
    if (!user) return false;
    // Only logged-in customers and agencies can access payments
    return role === 'customer' || role === 'agency' || role === 'admin';
  }, [user, role]);

  // Get payment info for a reservation
  const getPaymentInfo = useCallback(async (reservationId: string): Promise<PaymentInfo | null> => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('payment_status, partial_amount, payment_provider, payment_link, payment_completed_at')
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      return {
        status: (data.payment_status || 'pending') as PaymentStatus,
        partialAmount: data.partial_amount,
        paymentProvider: data.payment_provider,
        paymentLink: data.payment_link,
        paymentCompletedAt: data.payment_completed_at,
      };
    } catch (error) {
      console.error('Error fetching payment info:', error);
      return null;
    }
  }, []);

  // Update payment status (for admin use or after successful payment)
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
      const updateData: Record<string, any> = {
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

      toast.success("Payment status updated");
      return true;
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error("Failed to update payment status");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

  return {
    isLoading,
    isPaymentsEnabled: isPaymentsEnabled(),
    canAccessPayments: canAccessPayments(),
    getPaymentInfo,
    updatePaymentStatus,
    markPayOnTransfer,
    recordPartialPayment,
    markAsPaid,
  };
};
