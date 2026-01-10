import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { TrendingUp, TrendingDown, Building2, Banknote, Calculator, ChevronRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyTotals {
  totalAgencyIncome: number;
  totalDriverExpense: number;
  totalNetProfit: number;
  totalTransfers: number;
}

interface PendingConversion {
  reservationId: string;
  currency: string;
  amount: number;
}

export const MonthlyProfitCard = () => {
  const navigate = useNavigate();
  const [currentMonth] = useState(new Date());
  const [totals, setTotals] = useState<MonthlyTotals>({
    totalAgencyIncome: 0,
    totalDriverExpense: 0,
    totalNetProfit: 0,
    totalTransfers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [pendingConversions, setPendingConversions] = useState<PendingConversion[]>([]);

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    try {
      // Fetch ALL completed reservations with driver_earning (Bütçe) filled
      // This includes both agency reservations AND guest reservations
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select(`
          id,
          pickup_date,
          driver_earning,
          status,
          agency_id,
          price,
          price_currency
        `)
        .eq("status", "completed")
        .not("status", "eq", "deleted")
        .not("status", "eq", "cancelled_by_customer")
        .not("driver_earning", "is", null)
        .gt("driver_earning", 0)
        .gte("pickup_date", format(monthStart, "yyyy-MM-dd"))
        .lte("pickup_date", format(monthEnd, "yyyy-MM-dd"));

      if (resError) {
        console.error("Error fetching reservations:", resError);
        setLoading(false);
        return;
      }

      // Get all reservation IDs
      const reservationIds = reservations?.map(r => r.id) || [];
      const agencyReservationIds = reservations?.filter(r => r.agency_id).map(r => r.id) || [];

      // Fetch agency reservation details with TRY converted amount (only for agency reservations)
      let totalAgencyIncome = 0;
      let totalDriverExpense = 0;
      let validReservationCount = 0;
      const pending: PendingConversion[] = [];
      
      // Process AGENCY reservations
      if (agencyReservationIds.length > 0) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agency_reservation_details")
          .select("reservation_id, customer_price, agency_price_currency, exchange_rate_used")
          .in("reservation_id", agencyReservationIds);

        if (!agencyError && agencyData) {
          // Create map of reservation_id -> { tryAmount, hasCustomerPrice, needsConversion }
          const agencyMap = agencyData.reduce((acc, item) => {
            let tryAmount = 0;
            let needsConversion = false;
            // customer_price = Müşterinin acentaya ödediği fiyat = Acenta Geliri
            const customerPrice = item.customer_price || 0;
            const hasCustomerPrice = customerPrice > 0;
            
            // Eğer TRY ise direkt kullan
            // Eğer döviz ise ve kur varsa çevir, yoksa çevirme gerekli
            if (item.agency_price_currency === 'TRY') {
              tryAmount = customerPrice;
            } else if (item.exchange_rate_used && customerPrice > 0) {
              // Döviz ve kur varsa çevir
              tryAmount = customerPrice * item.exchange_rate_used;
            } else if (customerPrice > 0) {
              // Döviz çevrilmemiş - kur çekilmeli
              needsConversion = true;
              pending.push({
                reservationId: item.reservation_id,
                currency: item.agency_price_currency || 'EUR',
                amount: customerPrice
              });
            }
            acc[item.reservation_id] = { tryAmount, hasCustomerPrice, needsConversion };
            return acc;
          }, {} as Record<string, { tryAmount: number; hasCustomerPrice: boolean; needsConversion: boolean }>);

          // Count agency reservations that have BOTH driver_earning AND customer_price
          reservations?.filter(r => r.agency_id).forEach(res => {
            const agencyInfo = agencyMap[res.id];
            if (agencyInfo?.hasCustomerPrice) {
              totalAgencyIncome += agencyInfo.tryAmount;
              // Gider = driver_earning (Bütçe)
              totalDriverExpense += res.driver_earning || 0;
              validReservationCount++;
            }
          });
        }
      }
      
      // Process GUEST reservations (auto-priced) - use reservation price directly
      reservations?.filter(r => !r.agency_id).forEach(res => {
        // For guest reservations, income = price (otomatik fiyat veya admin fiyatı)
        if (res.price && res.price > 0) {
          // Convert to TRY if needed (most auto-prices are in EUR)
          let incomeAmount = res.price;
          if (res.price_currency && res.price_currency !== 'TRY') {
            // For now, use a rough conversion rate (will be improved later)
            // We should ideally fetch the exchange rate, but for simplicity:
            pending.push({
              reservationId: res.id,
              currency: res.price_currency,
              amount: res.price
            });
          } else {
            totalAgencyIncome += incomeAmount;
          }
          totalDriverExpense += res.driver_earning || 0;
          validReservationCount++;
        }
      });

      setPendingConversions(pending);
      setTotals({
        totalAgencyIncome,
        totalDriverExpense,
        totalNetProfit: totalAgencyIncome - totalDriverExpense,
        totalTransfers: validReservationCount,
      });
    } catch (error) {
      console.error("Error fetching monthly profit data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  // Auto-convert pending currencies
  const autoConvertPending = useCallback(async () => {
    if (pendingConversions.length === 0 || converting) return;
    
    console.log(`Auto-converting ${pendingConversions.length} pending currency conversions...`);
    setConverting(true);

    try {
      for (const item of pendingConversions) {
        try {
          const { data: rateData, error: rateError } = await supabase.functions.invoke('get-exchange-rate', {
            body: {
              from_currency: item.currency,
              to_currency: 'TRY',
              amount: item.amount
            }
          });

          if (rateError) {
            console.error('Exchange rate error:', rateError);
            continue;
          }

            if (rateData && rateData.rate) {
              await supabase
                .from('agency_reservation_details')
                .update({
                  exchange_rate_used: rateData.rate,
                  conversion_date: rateData.date
                })
                .eq('reservation_id', item.reservationId);
            }
        } catch (err) {
          console.error('Conversion error for reservation:', item.reservationId, err);
        }
      }

      // Refresh data after conversions
      fetchMonthlyData();
    } catch (error) {
      console.error('Auto-conversion error:', error);
    } finally {
      setConverting(false);
    }
  }, [pendingConversions, converting, fetchMonthlyData]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Trigger auto-conversion when pending conversions are detected
  useEffect(() => {
    if (pendingConversions.length > 0 && !loading && !converting) {
      autoConvertPending();
    }
  }, [pendingConversions, loading, autoConvertPending, converting]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className="col-span-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
      onClick={() => navigate('/admin/monthly-profit')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Aylık Kâr Hesabı
            {converting && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Toplam Transfer</div>
              <p className="text-xl font-bold">{totals.totalTransfers}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
                <Building2 className="h-3 w-3" />
                Acenta Geliri
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(totals.totalAgencyIncome)}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-1">
                <Banknote className="h-3 w-3" />
                Şoför Gideri
              </div>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(totals.totalDriverExpense)}
              </p>
            </div>

            <div className={`rounded-lg p-3 ${totals.totalNetProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
              <div className={`flex items-center gap-1 text-xs mb-1 ${totals.totalNetProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totals.totalNetProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                Admin Kâr
              </div>
              <p className={`text-xl font-bold ${totals.totalNetProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatCurrency(totals.totalNetProfit)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
