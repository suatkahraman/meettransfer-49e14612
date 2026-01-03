import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Building2, Car, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyProfit {
  date: string;
  agencyIncome: number; // TRY cinsinden
  driverExpense: number;
  netProfit: number;
  transferCount: number;
}

interface MonthlyTotals {
  totalAgencyIncome: number;
  totalDriverExpense: number;
  totalNetProfit: number;
}

interface AgencyDetailData {
  reservation_id: string;
  company_amount: number | null;
  company_amount_try: number | null;
  agency_price_currency: string | null;
}

export const MonthlyProfitCard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyData, setDailyData] = useState<DailyProfit[]>([]);
  const [totals, setTotals] = useState<MonthlyTotals>({
    totalAgencyIncome: 0,
    totalDriverExpense: 0,
    totalNetProfit: 0,
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
        .not("price", "is", null)
        .gte("pickup_date", format(monthStart, "yyyy-MM-dd"))
        .lte("pickup_date", format(monthEnd, "yyyy-MM-dd"));

      if (resError) {
        console.error("Error fetching reservations:", resError);
        setLoading(false);
        return;
      }

      // Get all reservation IDs (all have agency since we filtered above)
      const reservationIds = reservations?.map(r => r.id) || [];

      // Fetch agency reservation details with TRY converted amount
      let agencyDetails: Record<string, { tryAmount: number }> = {};
      if (reservationIds.length > 0) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agency_reservation_details")
          .select("reservation_id, company_amount, company_amount_try, agency_price_currency")
          .in("reservation_id", reservationIds);

        if (!agencyError && agencyData) {
          agencyDetails = (agencyData as AgencyDetailData[]).reduce((acc, item) => {
            // Use TRY converted amount if available, otherwise use original amount
            // If currency is already TRY, use company_amount directly
            let tryAmount = 0;
            if (item.company_amount_try) {
              tryAmount = item.company_amount_try;
            } else if (item.agency_price_currency === 'TRY') {
              tryAmount = item.company_amount || 0;
            } else {
              // No conversion available yet, use 0 (will need to be converted)
              tryAmount = item.company_amount || 0;
            }
            acc[item.reservation_id] = { tryAmount };
            return acc;
          }, {} as Record<string, { tryAmount: number }>);
        }
      }

      // Create daily breakdown
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const dailyMap = new Map<string, DailyProfit>();

      // Initialize all days
      daysInMonth.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        dailyMap.set(dateStr, {
          date: dateStr,
          agencyIncome: 0,
          driverExpense: 0,
          netProfit: 0,
          transferCount: 0,
        });
      });

      // Process reservations
      reservations?.forEach(res => {
        if (!res.pickup_date || !res.price) return;
        
        const dateStr = res.pickup_date;
        const dayData = dailyMap.get(dateStr);
        
        if (dayData) {
          // Increment transfer count
          dayData.transferCount += 1;
          
          // Agency Income in TRY (from company_amount_try or company_amount if TRY)
          const agencyIncome = agencyDetails[res.id]?.tryAmount || 0;
          dayData.agencyIncome += agencyIncome;
          
          // Driver Expense (Bütçe - price from reservations, already in TRY)
          const driverExpense = res.price || 0;
          dayData.driverExpense += driverExpense;
          
          // Net Profit = Acenta Geliri - Şöför Gideri
          dayData.netProfit = dayData.agencyIncome - dayData.driverExpense;
        }
      });

      // Convert to array and sort by date descending (most recent first)
      const dailyArray = Array.from(dailyMap.values())
        .filter(d => d.agencyIncome > 0 || d.driverExpense > 0)
        .sort((a, b) => b.date.localeCompare(a.date));

      // Calculate totals
      const monthTotals = dailyArray.reduce(
        (acc, day) => ({
          totalAgencyIncome: acc.totalAgencyIncome + day.agencyIncome,
          totalDriverExpense: acc.totalDriverExpense + day.driverExpense,
          totalNetProfit: acc.totalNetProfit + day.netProfit,
        }),
        { totalAgencyIncome: 0, totalDriverExpense: 0, totalNetProfit: 0 }
      );

      setDailyData(dailyArray);
      setTotals(monthTotals);
    } catch (error) {
      console.error("Error fetching monthly profit data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d MMM yyyy, EEEE", { locale: tr });
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Aylık Kâr Hesabı
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        ) : (
          <>
            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Acenta Geliri</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(totals.totalAgencyIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <Car className="h-4 w-4" />
                    <span className="text-xs font-medium">Şöför Gideri</span>
                  </div>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(totals.totalDriverExpense)}
                  </p>
                </CardContent>
              </Card>

              <Card className={`${totals.totalNetProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 mb-1 ${totals.totalNetProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totals.totalNetProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs font-medium">Net Kâr</span>
                  </div>
                  <p className={`text-lg font-bold ${totals.totalNetProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(totals.totalNetProfit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Breakdown */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                <div>Tarih</div>
                <div className="text-center">Transfer</div>
                <div className="text-right">Acenta Geliri</div>
                <div className="text-right">Şöför Gideri</div>
                <div className="text-right">Net Kâr</div>
              </div>
              <ScrollArea className="h-[300px]">
                {dailyData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Bu ay için veri bulunamadı
                  </div>
                ) : (
                  <div className="divide-y">
                    {dailyData.map(day => (
                      <div key={day.date} className="grid grid-cols-5 gap-2 p-3 text-sm hover:bg-muted/30">
                        <div className="font-medium">{formatDate(day.date)}</div>
                        <div className="text-center font-medium text-primary">
                          {day.transferCount}
                        </div>
                        <div className="text-right text-blue-600 dark:text-blue-400">
                          {day.agencyIncome > 0 ? formatCurrency(day.agencyIncome) : "-"}
                        </div>
                        <div className="text-right text-orange-600 dark:text-orange-400">
                          {day.driverExpense > 0 ? formatCurrency(day.driverExpense) : "-"}
                        </div>
                        <div className={`text-right font-medium ${day.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(day.netProfit)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
