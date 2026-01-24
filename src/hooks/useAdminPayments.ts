import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerPayment {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_completed_at: string | null;
  status: string;
}

export interface AgencyPayment {
  id: string;
  agency_id: string;
  agency_name: string;
  amount: number;
  currency: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentStats {
  customerCount: number;
  customerTotal: number;
  customerPending: number;
  customerPendingCount: number;
  agencyCount: number;
  agencyTotal: number;
  byProvider: Record<string, { count: number; total: number }>;
  byCurrency: Record<string, { customerTotal: number; agencyTotal: number; count: number }>;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

interface UseAdminPaymentsOptions {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  providerFilter: string;
  currencyFilter: string;
}

export const useAdminPayments = (options: UseAdminPaymentsOptions) => {
  const { searchQuery, statusFilter, dateFilter, providerFilter, currencyFilter } = options;
  
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [agencyPayments, setAgencyPayments] = useState<AgencyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch customer payments (only Stripe/PayPal online payments)
      const { data: customerData, error: customerError } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_code,
          customer_name,
          customer_phone,
          pickup,
          dropoff,
          pickup_date,
          price,
          price_currency,
          payment_status,
          payment_provider,
          payment_completed_at,
          status
        `)
        .in('payment_status', ['paid', 'pending', 'partial'])
        .in('payment_provider', ['stripe', 'paypal'])
        .order('payment_completed_at', { ascending: false, nullsFirst: false });

      if (customerError) {
        console.error('Error fetching customer payments:', customerError);
      } else {
        setCustomerPayments(customerData || []);
      }

      // Fetch agencies first
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('id, agency_name');

      // Fetch agency payments
      const { data: agencyData, error: agencyError } = await supabase
        .from('agency_payments')
        .select('*')
        // Online Ödemeler sayfası sadece Stripe/PayPal işlemlerini göstermeli.
        // Online işlemler (backend) created_by NULL bırakır ve/veya notlarda Stripe/PayPal ibaresi olur.
        // Admin panelinden manuel eklenen (offline) kayıtlar genelde created_by doludur ve not boş olabilir.
        .or('created_by.is.null,notes.ilike.%stripe%,notes.ilike.%paypal%')
        .order('payment_date', { ascending: false });

      if (agencyError) {
        console.error('Error fetching agency payments:', agencyError);
      } else {
        // Map agency names
        const paymentsWithNames = (agencyData || []).map(p => ({
          ...p,
          agency_name: agenciesData?.find(a => a.id === p.agency_id)?.agency_name || 'Bilinmiyor'
        }));
        setAgencyPayments(paymentsWithNames);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Filter customer payments
  const filteredCustomerPayments = useMemo(() => {
    let filtered = customerPayments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.customer_name?.toLowerCase().includes(query) ||
        p.customer_phone?.includes(query) ||
        p.reservation_code?.toLowerCase().includes(query) ||
        p.pickup?.toLowerCase().includes(query) ||
        p.dropoff?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_status === statusFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_provider === providerFilter);
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(p => p.price_currency === currencyFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(p => {
        if (!p.payment_completed_at) return false;
        const paymentDate = new Date(p.payment_completed_at);
        if (dateFilter === 'today') return paymentDate >= startOfToday;
        if (dateFilter === 'week') return paymentDate >= startOfWeek;
        if (dateFilter === 'month') return paymentDate >= startOfMonth;
        return true;
      });
    }

    return filtered;
  }, [customerPayments, searchQuery, statusFilter, dateFilter, providerFilter, currencyFilter]);

  // Filter agency payments
  const filteredAgencyPayments = useMemo(() => {
    let filtered = agencyPayments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.agency_name?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      );
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(p => p.currency === currencyFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.payment_date);
        if (dateFilter === 'today') return paymentDate >= startOfToday;
        if (dateFilter === 'week') return paymentDate >= startOfWeek;
        if (dateFilter === 'month') return paymentDate >= startOfMonth;
        return true;
      });
    }

    return filtered;
  }, [agencyPayments, searchQuery, dateFilter, currencyFilter]);

  // Calculate statistics - ONLY for online payments (Stripe/PayPal)
  // Note: customerPayments is already filtered to Stripe/PayPal from the query.
  // agencyPayments is also filtered above to only include Stripe/PayPal-originated entries.
  const stats = useMemo((): PaymentStats => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Customer payments are already filtered to Stripe/PayPal only from the query
    const customerPaid = customerPayments.filter(p => p.payment_status === 'paid');
    const customerPending = customerPayments.filter(p => p.payment_status === 'pending');
    const customerTotal = customerPaid.reduce((sum, p) => sum + (p.price || 0), 0);
    const customerPendingTotal = customerPending.reduce((sum, p) => sum + (p.price || 0), 0);
    const agencyTotal = agencyPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group by provider with counts (only from customerPayments which are online payments)
    const byProvider: Record<string, { count: number; total: number }> = {};
    customerPaid.forEach(p => {
      const provider = p.payment_provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { count: 0, total: 0 };
      }
      byProvider[provider].count += 1;
      byProvider[provider].total += p.price || 0;
    });

    // Group by currency (online customer + online agency payments)
    const byCurrency: Record<string, { customerTotal: number; agencyTotal: number; count: number }> = {};
    
    // Only add currencies from online customer payments (Stripe/PayPal)
    customerPaid.forEach(p => {
      const currency = p.price_currency || 'EUR';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { customerTotal: 0, agencyTotal: 0, count: 0 };
      }
      byCurrency[currency].customerTotal += p.price || 0;
      byCurrency[currency].count += 1;
    });
    
    // Add online agency totals
    agencyPayments.forEach(p => {
      const currency = p.currency || 'EUR';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { customerTotal: 0, agencyTotal: 0, count: 0 };
      }
      byCurrency[currency].agencyTotal += p.amount;
      // Note: count is for customer transactions only
    });

    // Time-based revenue - only online customer payments
    const todayRevenue = customerPaid
      .filter(p => p.payment_completed_at && new Date(p.payment_completed_at) >= startOfToday)
      .reduce((sum, p) => sum + (p.price || 0), 0);
    
    const weekRevenue = customerPaid
      .filter(p => p.payment_completed_at && new Date(p.payment_completed_at) >= startOfWeek)
      .reduce((sum, p) => sum + (p.price || 0), 0);
    
    const monthRevenue = customerPaid
      .filter(p => p.payment_completed_at && new Date(p.payment_completed_at) >= startOfMonth)
      .reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      customerCount: customerPaid.length,
      customerTotal,
      customerPending: customerPendingTotal,
      customerPendingCount: customerPending.length,
      agencyCount: agencyPayments.length,
      agencyTotal,
      byProvider,
      byCurrency,
      todayRevenue,
      weekRevenue,
      monthRevenue,
    };
  }, [customerPayments, agencyPayments]);

  // Get unique providers and currencies for filters
  const availableProviders = useMemo(() => {
    const providers = new Set<string>();
    customerPayments.forEach(p => {
      if (p.payment_provider) providers.add(p.payment_provider);
    });
    return Array.from(providers);
  }, [customerPayments]);

  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    customerPayments.forEach(p => {
      if (p.price_currency) currencies.add(p.price_currency);
    });
    agencyPayments.forEach(p => {
      if (p.currency) currencies.add(p.currency);
    });
    return Array.from(currencies).sort();
  }, [customerPayments, agencyPayments]);

  return {
    customerPayments: filteredCustomerPayments,
    agencyPayments: filteredAgencyPayments,
    allCustomerPayments: customerPayments,
    allAgencyPayments: agencyPayments,
    stats,
    loading,
    refreshing,
    handleRefresh,
    availableProviders,
    availableCurrencies,
  };
};
