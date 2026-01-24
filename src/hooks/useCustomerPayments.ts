import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PayableReservation } from '@/components/customer/BulkPaymentPanel';

export interface PaymentHistoryItem {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  payment_type: string | null;
  payment_provider: string | null;
  payment_completed_at: string | null;
  status: string;
  customer_name?: string;
  vehicle_type?: string;
  flight_number?: string;
  luggage_count?: number;
  baby_seat_count?: number;
}

export interface CustomerPaymentStats {
  totalReservations: number;
  paidCount: number;
  unpaidCount: number;
  totalPaid: number;
  totalUnpaid: number;
  cashCount: number;
  onlineCount: number;
  byCurrency: Record<string, { paid: number; unpaid: number }>;
  byProvider: Record<string, number>;
}

interface UseCustomerPaymentsOptions {
  language: 'TR' | 'EN';
}

export const useCustomerPayments = (options: UseCustomerPaymentsOptions) => {
  const { language } = options;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const translations = useMemo(() => ({
    paymentSuccess: language === 'TR' ? 'Ödeme başarılı!' : 'Payment successful!',
    paymentCancelled: language === 'TR' ? 'Ödeme iptal edildi' : 'Payment was cancelled',
    loadError: language === 'TR' ? 'Rezervasyonlar yüklenemedi' : 'Failed to load reservations',
  }), [language]);

  // Check for payment result from redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      toast.success(translations.paymentSuccess);
      navigate('/customer/payments', { replace: true });
    } else if (cancelled === 'true') {
      toast.info(translations.paymentCancelled);
      navigate('/customer/payments', { replace: true });
    }
  }, [searchParams, navigate, translations]);

  const fetchReservations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-customer-reservations');

      if (error) {
        console.error('Failed to fetch reservations:', error);
        toast.error(translations.loadError);
        return;
      }

      if (data?.reservations) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, translations]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReservations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchReservations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservations();
  }, [fetchReservations]);

  // Split reservations into unpaid and paid
  const { unpaidReservations, paidReservations } = useMemo(() => {
    const unpaid: PayableReservation[] = [];
    const paid: PaymentHistoryItem[] = [];

    reservations.forEach(r => {
      if (r.payment_status === 'paid' || r.payment_status === 'pay_on_transfer') {
        paid.push(r);
      } else if (
        r.price && 
        r.price > 0 && 
        !['cancelled', 'cancelled_by_customer', 'customer_rejected', 'completed'].includes(r.status)
      ) {
        unpaid.push(r as PayableReservation);
      }
    });

    // Sort paid by payment date (most recent first)
    paid.sort((a, b) => {
      if (a.payment_completed_at && b.payment_completed_at) {
        return new Date(b.payment_completed_at).getTime() - new Date(a.payment_completed_at).getTime();
      }
      return new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime();
    });

    return { unpaidReservations: unpaid, paidReservations: paid };
  }, [reservations]);

  // Calculate comprehensive statistics
  const stats = useMemo((): CustomerPaymentStats => {
    const paidItems = paidReservations.filter(r => r.payment_status === 'paid');
    const cashItems = paidReservations.filter(r => r.payment_status === 'pay_on_transfer');
    
    const totalPaid = paidItems.reduce((sum, r) => sum + (r.price || 0), 0);
    const totalUnpaid = unpaidReservations.reduce((sum, r) => sum + (r.price || 0), 0);

    // Group by currency
    const byCurrency: Record<string, { paid: number; unpaid: number }> = {};
    paidItems.forEach(r => {
      const currency = r.price_currency || 'EUR';
      if (!byCurrency[currency]) byCurrency[currency] = { paid: 0, unpaid: 0 };
      byCurrency[currency].paid += r.price || 0;
    });
    unpaidReservations.forEach(r => {
      const currency = r.price_currency || 'EUR';
      if (!byCurrency[currency]) byCurrency[currency] = { paid: 0, unpaid: 0 };
      byCurrency[currency].unpaid += r.price || 0;
    });

    // Group by provider
    const byProvider: Record<string, number> = {};
    paidItems.forEach(r => {
      const provider = r.payment_provider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + 1;
    });

    return {
      totalReservations: reservations.length,
      paidCount: paidItems.length,
      unpaidCount: unpaidReservations.length,
      totalPaid,
      totalUnpaid,
      cashCount: cashItems.length,
      onlineCount: paidItems.length,
      byCurrency,
      byProvider,
    };
  }, [reservations, paidReservations, unpaidReservations]);

  return {
    reservations,
    unpaidReservations,
    paidReservations,
    stats,
    loading: authLoading || loading,
    refreshing,
    handleRefresh,
  };
};
