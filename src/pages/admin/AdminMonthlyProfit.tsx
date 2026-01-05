import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Building2, Car, Calculator, ArrowLeft, User, Banknote, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReservationDetail {
  id: string;
  date: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  driverName: string | null;
  agencyIncome: number;
  agencyIncomeOriginal: number;
  agencyIncomeCurrency: string;
  exchangeRate: number | null;
  budget: number;
  driverExpense: number;
  netProfit: number;
  hasCashCollection: boolean;
  cashAmount: number;
  cashCurrency: string;
  needsConversion: boolean;
}

interface DailyProfit {
  date: string;
  agencyIncome: number;
  budget: number;
  driverExpense: number;
  netProfit: number;
  transferCount: number;
  reservations: ReservationDetail[];
}

interface MonthlyTotals {
  totalAgencyIncome: number;
  totalBudget: number;
  totalDriverExpense: number;
  totalNetProfit: number;
  totalTransfers: number;
}

const AdminMonthlyProfit = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyData, setDailyData] = useState<DailyProfit[]>([]);
  const [totals, setTotals] = useState<MonthlyTotals>({
    totalAgencyIncome: 0,
    totalBudget: 0,
    totalDriverExpense: 0,
    totalNetProfit: 0,
    totalTransfers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [convertingRates, setConvertingRates] = useState(false);
  const [pendingConversions, setPendingConversions] = useState<number>(0);

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    try {
      // Fetch completed reservations with agency assigned for the month
      // Must have driver_earning (Bütçe) filled
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select(`
          id,
          pickup_date,
          pickup,
          dropoff,
          customer_name,
          price,
          price_currency,
          driver_earning,
          status,
          agency_id,
          driver_id,
          passenger_cash_amount,
          passenger_cash_currency
        `)
        .eq("status", "completed")
        .not("status", "eq", "deleted")
        .not("status", "eq", "cancelled_by_customer")
        .not("agency_id", "is", null)
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
      const driverIds = [...new Set(reservations?.filter(r => r.driver_id).map(r => r.driver_id) || [])];

      // Fetch drivers
      let driversMap: Record<string, string> = {};
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from("drivers")
          .select("id, name")
          .in("id", driverIds);
        
        if (driversData) {
          driversMap = driversData.reduce((acc, d) => {
            acc[d.id] = d.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Fetch agency reservation details with TRY converted amount
      // customer_price = Müşterinin acentaya ödediği fiyat = Acenta Geliri
      let agencyDetails: Record<string, { 
        agencyIncome: number;
        originalAmount: number; 
        currency: string; 
        exchangeRate: number | null;
        needsConversion: boolean;
        reservationId: string;
        hasCustomerPrice: boolean;
      }> = {};
      
      let conversionsNeeded = 0;
      
      if (reservationIds.length > 0) {
        const { data: agencyData, error: agencyError } = await supabase
          .from("agency_reservation_details")
          .select("reservation_id, customer_price, agency_price_currency, exchange_rate_used")
          .in("reservation_id", reservationIds);

        if (!agencyError && agencyData) {
          agencyDetails = agencyData.reduce((acc, item) => {
            let agencyIncome = 0;
            let needsConversion = false;
            // customer_price = Müşterinin acentaya ödediği fiyat = Acenta Geliri
            const customerPrice = item.customer_price || 0;
            const hasCustomerPrice = customerPrice > 0;
            
            // Acenta Geliri = customer_price (Müşterinin acentaya ödediği fiyat)
            // Eğer TRY ise direkt customer_price kullan
            // Eğer döviz ise ve kur varsa çevir, yoksa çeviri gerekli
            if (item.agency_price_currency === 'TRY') {
              agencyIncome = customerPrice;
            } else if (item.exchange_rate_used && customerPrice > 0) {
              // Döviz ve kur varsa çevir
              agencyIncome = customerPrice * item.exchange_rate_used;
            } else {
              // Needs conversion - foreign currency without exchange rate
              needsConversion = customerPrice > 0;
              agencyIncome = 0; // Will be converted
              if (needsConversion) conversionsNeeded++;
            }
            
            acc[item.reservation_id] = { 
              agencyIncome,
              originalAmount: customerPrice,
              currency: item.agency_price_currency || 'TRY',
              exchangeRate: item.exchange_rate_used || null,
              needsConversion,
              reservationId: item.reservation_id,
              hasCustomerPrice
            };
            return acc;
          }, {} as Record<string, { agencyIncome: number; originalAmount: number; currency: string; exchangeRate: number | null; needsConversion: boolean; reservationId: string; hasCustomerPrice: boolean }>);
        }
      }
      
      setPendingConversions(conversionsNeeded);

      // Create daily breakdown
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const dailyMap = new Map<string, DailyProfit>();

      // Initialize all days
      daysInMonth.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        dailyMap.set(dateStr, {
          date: dateStr,
          agencyIncome: 0,
          budget: 0,
          driverExpense: 0,
          netProfit: 0,
          transferCount: 0,
          reservations: [],
        });
      });

      // Process reservations - only include those with BOTH driver_earning AND customer_price
      reservations?.forEach(res => {
        if (!res.pickup_date) return;
        
        const agencyInfo = agencyDetails[res.id];
        
        // CRITICAL: Only include reservations that have BOTH:
        // 1. driver_earning (Bütçe) > 0
        // 2. customer_price (Müşteri Fiyatı) > 0
        if (!agencyInfo?.hasCustomerPrice) return;
        
        const dateStr = res.pickup_date;
        const dayData = dailyMap.get(dateStr);
        
        if (dayData) {
          dayData.transferCount += 1;
          
          const agencyIncome = agencyInfo?.agencyIncome || 0;
          // Bütçe = driver_earning (şoför gideri/iş maliyeti) = Gider
          const budget = res.driver_earning || 0;
          const driverExpense = res.driver_earning || 0;
          
          dayData.agencyIncome += agencyIncome;
          dayData.budget += budget;
          dayData.driverExpense += driverExpense;
          dayData.netProfit = dayData.agencyIncome - dayData.budget;
          
          const needsConversion = agencyInfo?.needsConversion || false;
          
          // Add reservation detail
          dayData.reservations.push({
            id: res.id,
            date: dateStr,
            customerName: res.customer_name || 'Bilinmiyor',
            pickup: res.pickup || '',
            dropoff: res.dropoff || '',
            driverName: res.driver_id ? driversMap[res.driver_id] || 'Bilinmiyor' : null,
            agencyIncome,
            agencyIncomeOriginal: agencyInfo?.originalAmount || 0,
            agencyIncomeCurrency: agencyInfo?.currency || 'TRY',
            exchangeRate: agencyInfo?.exchangeRate || null,
            budget,
            driverExpense,
            netProfit: agencyIncome - budget,
            hasCashCollection: (res.passenger_cash_amount || 0) > 0,
            cashAmount: res.passenger_cash_amount || 0,
            cashCurrency: res.passenger_cash_currency || 'TRY',
            needsConversion,
          });
        }
      });

      // Convert to array and sort by date descending
      const dailyArray = Array.from(dailyMap.values())
        .filter(d => d.transferCount > 0)
        .sort((a, b) => b.date.localeCompare(a.date));

      // Calculate totals
      const monthTotals = dailyArray.reduce(
        (acc, day) => ({
          totalAgencyIncome: acc.totalAgencyIncome + day.agencyIncome,
          totalBudget: acc.totalBudget + day.budget,
          totalDriverExpense: acc.totalDriverExpense + day.driverExpense,
          totalNetProfit: acc.totalNetProfit + day.netProfit,
          totalTransfers: acc.totalTransfers + day.transferCount,
        }),
        { totalAgencyIncome: 0, totalBudget: 0, totalDriverExpense: 0, totalNetProfit: 0, totalTransfers: 0 }
      );

      setDailyData(dailyArray);
      setTotals(monthTotals);
    } catch (error) {
      console.error("Error fetching monthly profit data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  // Auto-convert pending currencies when data is loaded
  const autoConvertPending = useCallback(async () => {
    if (pendingConversions === 0 || dailyData.length === 0 || convertingRates) return;
    
    // Find all reservations needing conversion
    const reservationsToConvert: ReservationDetail[] = [];
    dailyData.forEach(day => {
      day.reservations.forEach(res => {
        if (res.needsConversion && res.agencyIncomeOriginal > 0) {
          reservationsToConvert.push(res);
        }
      });
    });
    
    if (reservationsToConvert.length === 0) return;
    
    console.log(`Auto-converting ${reservationsToConvert.length} pending currency conversions...`);
    setConvertingRates(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const res of reservationsToConvert) {
        try {
          const { data: rateData, error: rateError } = await supabase.functions.invoke('get-exchange-rate', {
            body: {
              from_currency: res.agencyIncomeCurrency,
              to_currency: 'TRY',
              amount: res.agencyIncomeOriginal
            }
          });

          if (rateError) {
            console.error('Exchange rate error:', rateError);
            errorCount++;
            continue;
          }

          if (rateData && rateData.rate && rateData.converted_amount) {
            const { error: updateError } = await supabase
              .from('agency_reservation_details')
              .update({
                company_amount_try: rateData.converted_amount,
                exchange_rate_used: rateData.rate,
                conversion_date: rateData.date
              })
              .eq('reservation_id', res.id);

            if (updateError) {
              console.error('Update error:', updateError);
              errorCount++;
            } else {
              successCount++;
            }
          }
        } catch (err) {
          console.error('Conversion error for reservation:', res.id, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} döviz kuru otomatik çevrildi`);
        fetchMonthlyData(); // Refresh data with new rates
      }
      if (errorCount > 0 && successCount === 0) {
        toast.error(`Döviz kuru çevrilemedi`);
      }
    } catch (error) {
      console.error('Auto-conversion error:', error);
    } finally {
      setConvertingRates(false);
    }
  }, [pendingConversions, dailyData, convertingRates, fetchMonthlyData]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Trigger auto-conversion when pending conversions are detected
  useEffect(() => {
    if (pendingConversions > 0 && !loading && !convertingRates) {
      autoConvertPending();
    }
  }, [pendingConversions, loading, autoConvertPending, convertingRates]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setExpandedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setExpandedDay(null);
  };

  // Convert all pending foreign currency amounts to TRY
  const convertAllToTRY = async () => {
    setConvertingRates(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Find all reservations needing conversion
      const reservationsToConvert: ReservationDetail[] = [];
      dailyData.forEach(day => {
        day.reservations.forEach(res => {
          if (res.needsConversion && res.agencyIncomeOriginal > 0) {
            reservationsToConvert.push(res);
          }
        });
      });

      for (const res of reservationsToConvert) {
        try {
          // Call exchange rate API
          const { data: rateData, error: rateError } = await supabase.functions.invoke('get-exchange-rate', {
            body: {
              from_currency: res.agencyIncomeCurrency,
              to_currency: 'TRY',
              amount: res.agencyIncomeOriginal
            }
          });

          if (rateError) {
            console.error('Exchange rate error:', rateError);
            errorCount++;
            continue;
          }

          if (rateData && rateData.rate && rateData.converted_amount) {
            // Update the database with converted amount
            const { error: updateError } = await supabase
              .from('agency_reservation_details')
              .update({
                company_amount_try: rateData.converted_amount,
                exchange_rate_used: rateData.rate,
                conversion_date: rateData.date
              })
              .eq('reservation_id', res.id);

            if (updateError) {
              console.error('Update error:', updateError);
              errorCount++;
            } else {
              successCount++;
            }
          }
        } catch (err) {
          console.error('Conversion error for reservation:', res.id, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} rezervasyon döviz kuru çevrildi`);
        fetchMonthlyData(); // Refresh data
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} rezervasyon çevrilemedi`);
      }
    } catch (error) {
      console.error('Bulk conversion error:', error);
      toast.error('Döviz kuru çevirme hatası');
    } finally {
      setConvertingRates(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d MMM yyyy, EEEE", { locale: tr });
  };

  const formatShortDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d MMM", { locale: tr });
  };

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  const adminProfit = totals.totalAgencyIncome - totals.totalBudget;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-serif flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Aylık Kâr Hesabı
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {format(currentMonth, "MMMM yyyy", { locale: tr })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        ) : (
          <>
            {/* Currency Conversion Alert */}
            {pendingConversions > 0 && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        {pendingConversions} rezervasyonun döviz kuru çevrilmemiş
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Güncel kurları çekmek için butona tıklayın
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={convertAllToTRY} 
                    disabled={convertingRates}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {convertingRates ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Çevriliyor...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Kurları Çek
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Car className="h-4 w-4" />
                    <span className="text-xs font-medium">Toplam Transfer</span>
                  </div>
                  <p className="text-2xl font-bold">{totals.totalTransfers}</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Acenta Geliri</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(totals.totalAgencyIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <Banknote className="h-4 w-4" />
                    <span className="text-xs font-medium">Şoför Gideri</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(totals.totalDriverExpense)}
                  </p>
                </CardContent>
              </Card>

              <Card className={`${adminProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 mb-1 ${adminProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {adminProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs font-medium">Admin Kâr</span>
                  </div>
                  <p className={`text-2xl font-bold ${adminProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(adminProfit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Breakdown with expandable details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Günlük Detaylar</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Bu ay için veri bulunamadı
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dailyData.map(day => (
                      <div key={day.date} className="border rounded-lg overflow-hidden">
                        {/* Day Header - Clickable */}
                        <div 
                          className="grid grid-cols-5 gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDay(day.date)}
                        >
                          <div className="font-medium">{formatDate(day.date)}</div>
                          <div className="text-center">
                            <Badge variant="secondary">{day.transferCount} transfer</Badge>
                          </div>
                          <div className="text-right text-blue-600 dark:text-blue-400 font-medium">
                            {formatCurrency(day.agencyIncome)}
                          </div>
                          <div className="text-right text-orange-600 dark:text-orange-400 font-medium">
                            {formatCurrency(day.budget)}
                          </div>
                          <div className={`text-right font-bold ${day.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(day.netProfit)}
                          </div>
                        </div>

                        {/* Expanded Reservations */}
                        {expandedDay === day.date && (
                          <div className="border-t bg-background divide-y">
                            {day.reservations.map(res => (
                              <div key={res.id} className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{res.customerName}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {res.pickup} → {res.dropoff}
                                    </div>
                                    {res.driverName && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Car className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">Kaptan:</span>
                                        <span className="font-medium">{res.driverName}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t mt-2">
                                  {/* Agency Income */}
                                  <div className={`rounded p-2 ${res.needsConversion ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
                                    <div className={`text-xs mb-1 ${res.needsConversion ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                      Acenta Geliri
                                      {res.needsConversion && <span className="ml-1">(Çevrilmemiş)</span>}
                                    </div>
                                    <div className={`font-bold ${res.needsConversion ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                      {res.needsConversion ? (
                                        formatCurrency(res.agencyIncomeOriginal, res.agencyIncomeCurrency)
                                      ) : (
                                        formatCurrency(res.agencyIncome)
                                      )}
                                    </div>
                                    {res.exchangeRate && res.agencyIncomeCurrency !== 'TRY' && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatCurrency(res.agencyIncomeOriginal, res.agencyIncomeCurrency)} × {res.exchangeRate.toFixed(4)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Budget */}
                                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded p-2">
                                    <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Bütçe</div>
                                    <div className="font-bold text-orange-700 dark:text-orange-300">
                                      {formatCurrency(res.budget)}
                                    </div>
                                  </div>

                                  {/* Driver Expense */}
                                  <div className="bg-muted/50 rounded p-2">
                                    <div className="text-xs text-muted-foreground mb-1">Şoför Ücreti</div>
                                    <div className="font-bold">
                                      {formatCurrency(res.driverExpense)}
                                    </div>
                                  </div>

                                  {/* Net Profit */}
                                  <div className={`rounded p-2 ${res.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                                    <div className={`text-xs mb-1 ${res.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      Admin Kâr
                                    </div>
                                    <div className={`font-bold ${res.netProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                      {formatCurrency(res.netProfit)}
                                    </div>
                                  </div>
                                </div>

                                {/* Cash Collection Info */}
                                {res.hasCashCollection && (
                                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                                      <Banknote className="h-4 w-4" />
                                      <span>Nakit Tahsilat: {formatCurrency(res.cashAmount, res.cashCurrency)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Summary Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Aylık Özet - {format(currentMonth, "MMMM yyyy", { locale: tr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Acenta Geliri (TL)</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalAgencyIncome)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Şoför Gideri</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">- {formatCurrency(totals.totalDriverExpense)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
                    <div className="flex items-center gap-2">
                      {adminProfit >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      )}
                      <span className="text-lg font-bold">Admin Kâr</span>
                    </div>
                    <span className={`text-2xl font-bold ${adminProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(adminProfit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminMonthlyProfit;
