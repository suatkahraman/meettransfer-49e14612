import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgencyPayableReservation } from '@/components/agency/AgencyBulkPaymentPanel';

export interface AgencyPaymentHistoryItem extends AgencyPayableReservation {
  payment_provider: string | null;
  payment_completed_at: string | null;
}

export interface AgencyPaymentStats {
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

interface UseAgencyPaymentsOptions {
  language?: 'TR' | 'EN';
}

export const useAgencyPayments = (options: UseAgencyPaymentsOptions = {}) => {
  const { language: agencyLang } = useAgencyTranslations();
  const language = options.language || (agencyLang === 'TR' ? 'TR' : 'EN');
  
  const { user, loading: authLoading } = useAuth();
  const { agencyId } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState<AgencyPaymentHistoryItem[]>([]);
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
      navigate('/agency/payments', { replace: true });
    } else if (cancelled === 'true') {
      toast.info(translations.paymentCancelled);
      navigate('/agency/payments', { replace: true });
    }
  }, [searchParams, navigate, translations]);

  const fetchReservations = useCallback(async () => {
    if (!agencyId) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          pickup,
          dropoff,
          pickup_place_name,
          dropoff_place_name,
          pickup_date,
          pickup_time,
          customer_name,
          price,
          price_currency,
          payment_status,
          payment_provider,
          payment_completed_at,
          status,
          agency_reservation_details (
            customer_price,
            company_amount,
            agency_price_currency,
            payment_status
          )
        `)
        .eq('agency_id', agencyId)
        .not('status', 'in', '("cancelled","cancelled_by_customer")')
        .order('pickup_date', { ascending: false });

      if (error) {
        console.error('Failed to fetch agency reservations:', error);
        toast.error(translations.loadError);
        return;
      }

      if (data) {
        setReservations(data as AgencyPaymentHistoryItem[]);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agencyId, translations]);

  useEffect(() => {
    if (!authLoading && agencyId) {
      fetchReservations();
    } else if (!authLoading && !agencyId) {
      setLoading(false);
    }
  }, [authLoading, agencyId, fetchReservations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservations();
  }, [fetchReservations]);

  // Helper functions for agency pricing
  const getCompanyAmount = useCallback((r: AgencyPaymentHistoryItem): number => {
    return r.agency_reservation_details?.company_amount || r.price || 0;
  }, []);

  const getCurrency = useCallback((r: AgencyPaymentHistoryItem): string => {
    return r.agency_reservation_details?.agency_price_currency || r.price_currency || 'EUR';
  }, []);

  const getPaymentStatus = useCallback((r: AgencyPaymentHistoryItem): string | null => {
    return r.agency_reservation_details?.payment_status || r.payment_status;
  }, []);

  // Split reservations into unpaid and paid
  const { unpaidReservations, paidReservations } = useMemo(() => {
    const unpaid: AgencyPaymentHistoryItem[] = [];
    const paid: AgencyPaymentHistoryItem[] = [];

    reservations.forEach(r => {
      const paymentStatus = getPaymentStatus(r);
      const companyAmount = getCompanyAmount(r);

      if (paymentStatus === 'paid' || r.payment_status === 'paid' || r.payment_status === 'pay_on_transfer') {
        paid.push(r);
      } else if (
        companyAmount > 0 && 
        !['cancelled', 'cancelled_by_customer', 'customer_rejected', 'completed'].includes(r.status)
      ) {
        unpaid.push(r);
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
  }, [reservations, getPaymentStatus, getCompanyAmount]);

  // Calculate comprehensive statistics
  const stats = useMemo((): AgencyPaymentStats => {
    const paidItems = paidReservations.filter((r: AgencyPaymentHistoryItem) => 
      getPaymentStatus(r) === 'paid' || r.payment_status === 'paid'
    );
    const cashItems = paidReservations.filter((r: AgencyPaymentHistoryItem) => 
      r.payment_status === 'pay_on_transfer'
    );
    
    const totalPaid = paidItems.reduce((sum: number, r: AgencyPaymentHistoryItem) => sum + getCompanyAmount(r), 0);
    const totalUnpaid = unpaidReservations.reduce((sum: number, r: AgencyPaymentHistoryItem) => sum + getCompanyAmount(r), 0);

    // Group by currency
    const byCurrency: Record<string, { paid: number; unpaid: number }> = {};
    paidItems.forEach((r: AgencyPaymentHistoryItem) => {
      const currency = getCurrency(r);
      if (!byCurrency[currency]) byCurrency[currency] = { paid: 0, unpaid: 0 };
      byCurrency[currency].paid += getCompanyAmount(r);
    });
    unpaidReservations.forEach((r: AgencyPaymentHistoryItem) => {
      const currency = getCurrency(r);
      if (!byCurrency[currency]) byCurrency[currency] = { paid: 0, unpaid: 0 };
      byCurrency[currency].unpaid += getCompanyAmount(r);
    });

    // Group by provider
    const byProvider: Record<string, number> = {};
    paidItems.forEach((r: AgencyPaymentHistoryItem) => {
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
  }, [reservations, paidReservations, unpaidReservations, getPaymentStatus, getCompanyAmount, getCurrency]);

  return {
    reservations,
    unpaidReservations,
    paidReservations,
    stats,
    agencyId,
    language,
    loading: authLoading || loading,
    refreshing,
    handleRefresh,
    getCompanyAmount,
    getCurrency,
    getPaymentStatus,
  };
};
