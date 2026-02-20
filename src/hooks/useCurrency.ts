import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Currency, FALLBACK_EXCHANGE_RATES } from '@/lib/currency';

export function useCurrency(preferredCurrency: Currency = 'EUR') {
  const [eurToPreferredRate, setEurToPreferredRate] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRate = async () => {
      setLoading(true);

      if (preferredCurrency === 'EUR') {
        setEurToPreferredRate(1);
        setLoading(false);
        return;
      }

      try {
        // First try to read the most recent rate from the exchange_rates table
        const { data: dbData, error: dbError } = await supabase
          .from('exchange_rates')
          .select('rate, date')
          .eq('from_currency', 'EUR')
          .eq('to_currency', preferredCurrency)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          if (dbError) {
            console.warn('useCurrency: DB lookup failed, falling back to function or constants', dbError);
          }

          if (dbData && (dbData as any).rate && Number.isFinite((dbData as any).rate)) {
            setEurToPreferredRate((dbData as any).rate);
            setLoading(false);
            return;
          }

          // If DB doesn't have it, fall back to serverless function (if available)
          try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke('get-exchange-rate', {
              body: { from: 'EUR', to: preferredCurrency }
            });

            if (fnError) throw fnError;

            if (fnData && (fnData as any).rate && Number.isFinite((fnData as any).rate)) {
              setEurToPreferredRate((fnData as any).rate);
              setLoading(false);
              return;
            }
          } catch (fnErr) {
            console.warn('useCurrency: function lookup failed, using fallback rates', fnErr);
          }

          // Final fallback to hardcoded rates
          setEurToPreferredRate(FALLBACK_EXCHANGE_RATES[preferredCurrency] ?? 1);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('useCurrency: failed to fetch exchange rate', error);
          setEurToPreferredRate(FALLBACK_EXCHANGE_RATES[preferredCurrency] ?? 1);
          setLoading(false);
        }
      }
    };

    fetchRate();

    return () => {
      cancelled = true;
    };
  }, [preferredCurrency]);

  const getDisplayPrice = useCallback(
    (priceEur: number | null | undefined): number | null => {
      if (priceEur == null || !Number.isFinite(priceEur)) return null;
      if (preferredCurrency === 'EUR') return Math.round(priceEur);

      const rateToUse = loading
        ? FALLBACK_EXCHANGE_RATES[preferredCurrency] ?? eurToPreferredRate
        : eurToPreferredRate;

      return Math.round(priceEur * rateToUse);
    },
    [preferredCurrency, eurToPreferredRate, loading]
  );

  const convertToEur = useCallback(
    (price: number | null | undefined): number | null => {
      if (price == null || !Number.isFinite(price)) return null;
      if (preferredCurrency === 'EUR') return Math.round(price);
      // avoid dividing by zero
      const rate = eurToPreferredRate || (FALLBACK_EXCHANGE_RATES[preferredCurrency] ?? 1);
      return Math.round(price / rate);
    },
    [preferredCurrency, eurToPreferredRate]
  );

  return {
    preferredCurrency,
    eurToPreferredRate,
    loading,
    getDisplayPrice,
    convertToEur,
  };
}
