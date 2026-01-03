import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { TrendingUp, TrendingDown, Building2, Banknote, Calculator, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyTotals {
  totalAgencyIncome: number;
  totalDriverExpense: number;
  totalNetProfit: number;
  totalTransfers: number;
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

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    try {
      // Fetch completed reservations with agency assigned for the month
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select(`
          id,
          pickup_date,
          price,
          status,
          agency_id
        `)
        .eq("status", "completed")
        .not("agency_id", "is", null)
        .gte("pickup_date", format(monthStart, "yyyy-MM-dd"))
        .lte("pickup_date", format(monthEnd, "yyyy-MM-dd"));

      if (resError) {
        console.error("Error fetching reservations:", resError);
        setLoading(false);
        return;
      }

      // Get all reservation IDs
      const reservationIds = reservations?.map(r => r.id) || [];

      // Fetch agency reservation details with TRY converted amount
      let totalAgencyIncome = 0;
      let totalDriverExpense = 0;
      
      if (reservationIds.length > 0) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agency_reservation_details")
          .select("reservation_id, company_amount, company_amount_try, agency_price_currency")
          .in("reservation_id", reservationIds);

        if (!agencyError && agencyData) {
          const agencyMap = agencyData.reduce((acc, item) => {
            let tryAmount = 0;
            // Acenta Geliri = company_amount_try (TRY'ye çevrilmiş tutar)
            // Eğer TRY ise direkt company_amount kullan
            // Eğer döviz ise ve çevrilmemişse 0 say (çeviri gerekiyor)
            if (item.company_amount_try) {
              tryAmount = item.company_amount_try;
            } else if (item.agency_price_currency === 'TRY') {
              tryAmount = item.company_amount || 0;
            } else {
              // Döviz çevrilmemiş - 0 olarak say
              tryAmount = 0;
            }
            acc[item.reservation_id] = tryAmount;
            return acc;
          }, {} as Record<string, number>);

          // Bütçe = reservations.price (şoför ücreti)
          reservations?.forEach(res => {
            totalAgencyIncome += agencyMap[res.id] || 0;
            totalDriverExpense += res.price || 0; // Bütçe = Şoför ücreti
          });
        }
      }

      setTotals({
        totalAgencyIncome,
        totalDriverExpense,
        totalNetProfit: totalAgencyIncome - totalDriverExpense,
        totalTransfers: reservations?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching monthly profit data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

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
                Gider (Bütçe)
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
