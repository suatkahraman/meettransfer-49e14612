import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, TrendingUp, DollarSign, CreditCard, Wallet, CheckCircle, Clock, Calendar, History, ChevronRight, RefreshCw, FileDown, FileSpreadsheet } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateCurrencyBalances, CurrencyBalance, getCurrencySymbol } from '@/lib/currency';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Heavy libraries loaded dynamically for better bundle size
const loadJsPDF = () => import('jspdf');
const loadAutoTable = () => import('jspdf-autotable');
const loadExcelJS = () => import('exceljs');

interface AgencyReservationDetail {
  id: string;
  reservation_id: string;
  customer_price: number;
  company_amount: number;
  agency_profit: number;
  payment_status: string;
  agency_price_currency: string | null;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  status: string;
  pickup_date: string;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
}

interface AgencyTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
  currency: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  notes: string | null;
}

const AgencyReports = () => {
  const { agencyId } = useUserRole();
  const { t, locale } = useAgencyTranslations();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agency, setAgency] = useState<{ agency_name: string; balance: number; currency: string } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail[]>([]);
  const [transactions, setTransactions] = useState<AgencyTransaction[]>([]);
  const [carryoverBalances, setCarryoverBalances] = useState<CurrencyBalance[]>([]);
  const [currentMonthBalances, setCurrentMonthBalances] = useState<CurrencyBalance[]>([]);

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);

    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch agency info
    const { data: agencyData } = await supabase
      .from('agencies')
      .select('agency_name, balance, currency')
      .eq('id', agencyId)
      .single();

    if (agencyData) {
      setAgency(agencyData);
    }

    // Fetch current month reservations + previous months completed reservations for carryover
    const [resDataRes, prevMonthsReservationsRes, allPaymentsRes, transDataRes] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, reservation_code, status, pickup_date, passenger_cash_amount, passenger_cash_currency')
        .eq('agency_id', agencyId)
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd),
      // Fetch all completed reservations before this month for carryover calculation
      supabase
        .from('reservations')
        .select('id, status, pickup_date, passenger_cash_amount, passenger_cash_currency')
        .eq('agency_id', agencyId)
        .eq('status', 'completed')
        .lt('pickup_date', monthStart),
      // Fetch all agency payments
      supabase
        .from('agency_payments')
        .select('*')
        .eq('agency_id', agencyId),
      // Fetch recent transactions
      supabase
        .from('agency_transactions')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const resData = resDataRes.data || [];
    const prevMonthsReservations = prevMonthsReservationsRes.data || [];
    const allPayments = allPaymentsRes.data || [];

    setReservations(resData);
    setTransactions(transDataRes.data || []);

    // Fetch agency details for current month completed reservations
    const currentMonthCompleted = resData.filter(r => r.status === 'completed');
    let currentMonthDetails: AgencyReservationDetail[] = [];
    
    if (resData.length > 0) {
      const resIds = resData.map(r => r.id);
      const { data: detailsData } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .in('reservation_id', resIds);

      currentMonthDetails = detailsData || [];
      setAgencyDetails(currentMonthDetails);
    } else {
      setAgencyDetails([]);
    }

    // Current month payments
    const currentMonthPayments = allPayments.filter(p => 
      p.payment_date >= monthStart && p.payment_date <= monthEnd
    );

    // Calculate current month balances using shared helper
    // YENİ: customer_price kullanılıyor (hem borç hem kâr hesabı için)
    const currentMonthReservationsWithDetails: import('@/lib/currency').CompletedReservationData[] = currentMonthCompleted.map(r => {
      const detail = currentMonthDetails.find(d => d.reservation_id === r.id);
      return {
        passenger_cash_amount: r.passenger_cash_amount ?? null,
        passenger_cash_currency: r.passenger_cash_currency ?? null,
        agency_reservation_details: detail ? {
          customer_price: detail.customer_price ?? null,
          company_amount: detail.company_amount ?? null,
          agency_price_currency: detail.agency_price_currency ?? null
        } : null
      };
    });

    const currentBalances = calculateCurrencyBalances(
      currentMonthReservationsWithDetails,
      currentMonthPayments.map(p => ({ amount: p.amount, currency: p.currency }))
    );
    setCurrentMonthBalances(currentBalances);

    // Calculate carryover balances (previous months)
    if (prevMonthsReservations.length > 0) {
      const prevReservationIds = prevMonthsReservations.map(r => r.id);
      const { data: prevDetailsData } = await supabase
        .from('agency_reservation_details')
        .select('reservation_id, customer_price, company_amount, agency_price_currency')
        .in('reservation_id', prevReservationIds);
      
      const prevDetails = prevDetailsData || [];
      
      // Build data for calculateCurrencyBalances
      // YENİ: customer_price kullanılıyor
      const prevReservationsWithDetails: import('@/lib/currency').CompletedReservationData[] = prevMonthsReservations.map(r => {
        const detail = prevDetails.find(d => d.reservation_id === r.id);
        return {
          passenger_cash_amount: r.passenger_cash_amount ?? null,
          passenger_cash_currency: r.passenger_cash_currency ?? null,
          agency_reservation_details: detail ? {
            customer_price: detail.customer_price ?? null,
            company_amount: detail.company_amount ?? null,
            agency_price_currency: detail.agency_price_currency ?? null
          } : null
        };
      });

      // Previous months payments
      const prevMonthsPayments = allPayments.filter(p => p.payment_date < monthStart);

      const carryover = calculateCurrencyBalances(
        prevReservationsWithDetails,
        prevMonthsPayments.map(p => ({ amount: p.amount, currency: p.currency }))
      );
      setCarryoverBalances(carryover);
    } else {
      // Still check for payments before this month without reservations
      const prevMonthsPayments = allPayments.filter(p => p.payment_date < monthStart);
      if (prevMonthsPayments.length > 0) {
        const carryover = calculateCurrencyBalances(
          [],
          prevMonthsPayments.map(p => ({ amount: p.amount, currency: p.currency }))
        );
        setCarryoverBalances(carryover);
      } else {
        setCarryoverBalances([]);
      }
    }

    setLoading(false);
  }, [agencyId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalReservations = reservations.length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const paidCount = agencyDetails.filter(d => d.payment_status === 'paid').length;
  const pendingPayments = agencyDetails.filter(d => d.payment_status !== 'paid').length;
  
  // Combine carryover + current month for total balance per currency
  const combinedBalances: CurrencyBalance[] = [];
  const allCurrencies = new Set([
    ...carryoverBalances.map(cb => cb.currency),
    ...currentMonthBalances.map(cb => cb.currency)
  ]);
  
  allCurrencies.forEach(currency => {
    const carryover = carryoverBalances.find(cb => cb.currency === currency);
    const current = currentMonthBalances.find(cb => cb.currency === currency);
    
    const totalCompanyAmount = (carryover?.totalCompanyAmount || 0) + (current?.totalCompanyAmount || 0);
    const totalPassengerCash = (carryover?.totalPassengerCash || 0) + (current?.totalPassengerCash || 0);
    const totalPaid = (carryover?.totalPaid || 0) + (current?.totalPaid || 0);
    const netBalance = totalCompanyAmount - totalPassengerCash - totalPaid;
    
    if (netBalance !== 0 || totalCompanyAmount > 0) {
      combinedBalances.push({
        currency,
        totalCompanyAmount,
        totalPassengerCash,
        totalPaid,
        netBalance
      });
    }
  });
  
  combinedBalances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

  // Export functions - dynamically load heavy libraries
  const generatePDF = useCallback(async () => {
    if (!agency) return;
    
    try {
      toast.loading('PDF oluşturuluyor...');
      
      // Dynamically import heavy libraries
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        loadJsPDF(),
        loadAutoTable()
      ]);
      const autoTable = autoTableModule.default;
      
      const monthName = format(currentMonth, 'MMMM yyyy', { locale: tr });
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(`${agency.agency_name} - Aylık Rapor`, 14, 20);
      doc.setFontSize(12);
      doc.text(monthName, 14, 28);
      
      // Summary section
      doc.setFontSize(14);
      doc.text('Özet', 14, 42);
      doc.setFontSize(10);
      doc.text(`Toplam Rezervasyon: ${totalReservations}`, 14, 50);
      doc.text(`Tamamlanan: ${completedReservations}`, 14, 56);
      doc.text(`Ödenen: ${paidCount}`, 14, 62);
      doc.text(`Bekleyen Ödeme: ${pendingPayments}`, 14, 68);
      
      // Balance per currency
      let yPos = 82;
      doc.setFontSize(14);
      doc.text('Bakiye Özeti', 14, yPos);
      yPos += 10;
      
      if (combinedBalances.length > 0) {
        const balanceData = combinedBalances.map(cb => [
          cb.currency,
          `${getCurrencySymbol(cb.currency)}${cb.totalCompanyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${getCurrencySymbol(cb.currency)}${cb.totalPassengerCash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${getCurrencySymbol(cb.currency)}${cb.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${cb.netBalance > 0 ? '' : '-'}${getCurrencySymbol(cb.currency)}${Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Para Birimi', 'Toplam Gider', 'Nakit Alınan', 'Ödenen', 'Net Bakiye']],
          body: balanceData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Current month breakdown
      if (currentMonthBalances.length > 0) {
        doc.setFontSize(14);
        doc.text(`${monthName} Detay`, 14, yPos);
        yPos += 10;
        
        const monthData = currentMonthBalances.map(cb => [
          cb.currency,
          `${getCurrencySymbol(cb.currency)}${cb.totalCompanyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${getCurrencySymbol(cb.currency)}${cb.totalPassengerCash.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${getCurrencySymbol(cb.currency)}${cb.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          `${cb.netBalance > 0 ? '' : '-'}${getCurrencySymbol(cb.currency)}${Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Para Birimi', 'Gider', 'Nakit', 'Ödenen', 'Net']],
          body: monthData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Transactions
      if (transactions.length > 0) {
        doc.setFontSize(14);
        doc.text('Son İşlemler', 14, yPos);
        yPos += 10;
        
        const txData = transactions.slice(0, 10).map(tx => [
          format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm'),
          tx.type === 'top_up' ? 'Ödeme' : 'Kesinti',
          `${tx.type === 'top_up' ? '+' : '-'}${getCurrencySymbol(tx.currency)}${Math.abs(tx.amount).toLocaleString('tr-TR')}`,
          tx.description || '-',
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Tarih', 'Tür', 'Tutar', 'Açıklama']],
          body: txData,
          theme: 'striped',
          headStyles: { fillColor: [168, 85, 247] },
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Oluşturulma: ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Sayfa ${i}/${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save(`${agency.agency_name.replace(/\s+/g, '_')}_Rapor_${format(currentMonth, 'yyyy_MM')}.pdf`);
      toast.dismiss();
      toast.success('PDF başarıyla oluşturuldu');
    } catch (error) {
      toast.dismiss();
      toast.error('PDF oluşturulamadı');
      console.error('PDF generation error:', error);
    }
  }, [agency, currentMonth, totalReservations, completedReservations, paidCount, pendingPayments, combinedBalances, currentMonthBalances, transactions]);

  const generateExcel = useCallback(async () => {
    if (!agency) return;
    
    try {
      toast.loading('Excel oluşturuluyor...');
      
      // Dynamically import ExcelJS (secure alternative to xlsx)
      const ExcelJS = await loadExcelJS();
      
      const monthName = format(currentMonth, 'MMMM yyyy', { locale: tr });
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Meet Transfer';
      workbook.created = new Date();
      
      // Summary sheet
      const summarySheet = workbook.addWorksheet('Özet');
      summarySheet.addRows([
        ['Acenta Adı', agency.agency_name],
        ['Rapor Dönemi', monthName],
        ['Oluşturulma Tarihi', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['ÖZET'],
        ['Toplam Rezervasyon', totalReservations],
        ['Tamamlanan', completedReservations],
        ['Ödenen', paidCount],
        ['Bekleyen Ödeme', pendingPayments],
      ]);
      
      // Style the summary header
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 25;
      
      // Balance sheet
      if (combinedBalances.length > 0) {
        const balanceSheet = workbook.addWorksheet('Bakiye');
        balanceSheet.addRow(['Para Birimi', 'Toplam Gider', 'Nakit Alınan', 'Ödenen', 'Net Bakiye', 'Durum']);
        combinedBalances.forEach(cb => {
          balanceSheet.addRow([
            cb.currency,
            cb.totalCompanyAmount,
            cb.totalPassengerCash,
            cb.totalPaid,
            cb.netBalance,
            cb.netBalance > 0 ? 'Borç' : cb.netBalance < 0 ? 'Alacak' : 'Hesaplaşıldı',
          ]);
        });
        // Style headers
        balanceSheet.getRow(1).font = { bold: true };
        balanceSheet.columns.forEach(col => col.width = 15);
      }
      
      // Current month sheet
      if (currentMonthBalances.length > 0) {
        const monthSheet = workbook.addWorksheet(monthName);
        monthSheet.addRow(['Para Birimi', 'Gider', 'Nakit Alınan', 'Ödenen', 'Net Bakiye']);
        currentMonthBalances.forEach(cb => {
          monthSheet.addRow([
            cb.currency,
            cb.totalCompanyAmount,
            cb.totalPassengerCash,
            cb.totalPaid,
            cb.netBalance,
          ]);
        });
        monthSheet.getRow(1).font = { bold: true };
        monthSheet.columns.forEach(col => col.width = 15);
      }
      
      // Transactions sheet
      if (transactions.length > 0) {
        const txSheet = workbook.addWorksheet('İşlemler');
        txSheet.addRow(['Tarih', 'Tür', 'Tutar', 'Para Birimi', 'Bakiye Sonrası', 'Açıklama']);
        transactions.forEach(tx => {
          txSheet.addRow([
            format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm'),
            tx.type === 'top_up' ? 'Ödeme' : 'Kesinti',
            tx.type === 'top_up' ? tx.amount : -tx.amount,
            tx.currency,
            tx.balance_after,
            tx.description || '',
          ]);
        });
        txSheet.getRow(1).font = { bold: true };
        txSheet.getColumn(1).width = 18;
        txSheet.getColumn(2).width = 10;
        txSheet.getColumn(6).width = 30;
      }
      
      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agency.agency_name.replace(/\s+/g, '_')}_Rapor_${format(currentMonth, 'yyyy_MM')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Excel başarıyla oluşturuldu');
    } catch (error) {
      toast.dismiss();
      toast.error('Excel oluşturulamadı');
      console.error('Excel generation error:', error);
    }
  }, [agency, currentMonth, totalReservations, completedReservations, paidCount, pendingPayments, combinedBalances, currentMonthBalances, transactions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-serif">{t('agencyReports')}</h1>
            {agency && <p className="text-sm opacity-80">{agency.agency_name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Buttons */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generatePDF}
            disabled={loading || !agency}
            className="text-primary-foreground hover:bg-primary-foreground/10 gap-2"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateExcel}
            disabled={loading || !agency}
            className="text-primary-foreground hover:bg-primary-foreground/10 gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchData}
            disabled={loading}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
        {/* Overall Balance Cards - Clickable for details */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('currentBalance') || 'Güncel Bakiye'}
          </h2>
          
          {combinedBalances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combinedBalances.map(cb => {
                const symbol = getCurrencySymbol(cb.currency);
                return (
                  <motion.div
                    key={`current-${cb.currency}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        cb.netBalance > 0 
                          ? "border-orange-500/50 border-2 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background" 
                          : cb.netBalance < 0
                          ? "border-green-500/50 border-2 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background"
                          : "border-muted"
                      )}
                      onClick={() => navigate(`/agency/currency/${cb.currency}`)}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              cb.netBalance > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30"
                            )}>
                              <Wallet className={cn(
                                "h-5 w-5",
                                cb.netBalance > 0 ? "text-orange-600" : "text-green-600"
                              )} />
                            </div>
                            <Badge variant="outline" className="font-mono text-sm">{cb.currency}</Badge>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <div className="space-y-1">
                          <p className={cn(
                            "text-3xl font-bold",
                            cb.netBalance > 0 ? "text-orange-600" : cb.netBalance < 0 ? "text-green-600" : "text-gray-600"
                          )}>
                            {symbol}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={cn(
                            "text-sm font-medium",
                            cb.netBalance > 0 ? "text-orange-600" : cb.netBalance < 0 ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {cb.netBalance > 0 ? (t('amountOwed') || 'Borç') : cb.netBalance < 0 ? (t('creditBalance') || 'Alacak') : (t('settled') || 'Hesaplaşıldı')}
                          </p>
                        </div>

                        {/* Quick breakdown */}
                        <div className="mt-3 pt-3 border-t border-dashed space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t('agencyExpense') || 'Gider'}</span>
                            <span>{symbol}{cb.totalCompanyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                          </div>
                          {cb.totalPassengerCash > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('passengerCash') || 'Nakit'}</span>
                              <span className="text-green-600">-{symbol}{cb.totalPassengerCash.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                            </div>
                          )}
                          {cb.totalPaid > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('paid') || 'Ödenen'}</span>
                              <span className="text-green-600">-{symbol}{cb.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-lg font-medium text-muted-foreground">{t('noBalance') || 'Bakiye Yok'}</p>
                <p className="text-sm text-muted-foreground/70">{t('noCompletedReservations') || 'Tamamlanmış rezervasyon yok'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Month Navigator */}
        <MonthNavigator 
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        {/* Monthly Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Carryover Balance - Compact */}
          {carryoverBalances.filter(cb => cb.netBalance !== 0).length > 0 && (
            <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 pb-3">
                <History className="h-6 w-6 text-blue-500 mb-2" />
                <p className="text-xs text-muted-foreground mb-1">{t('carryoverBalance') || 'Devir'}</p>
                <div className="space-y-0.5">
                  {carryoverBalances.filter(cb => cb.netBalance !== 0).slice(0, 2).map(cb => (
                    <p key={`carry-${cb.currency}`} className="text-lg font-bold text-blue-600">
                      {getCurrencySymbol(cb.currency)}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      <span className="text-xs ml-1 font-normal">{cb.currency}</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{totalReservations}</p>
              <p className="text-xs text-muted-foreground">{t('totalReservations') || 'Rezervasyon'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-800">
            <CardContent className="pt-4 pb-3 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{completedReservations}</p>
              <p className="text-xs text-muted-foreground">{t('completed') || 'Tamamlanan'}</p>
            </CardContent>
          </Card>

          {/* This month debt summary */}
          {currentMonthBalances.length > 0 ? (
            currentMonthBalances.slice(0, 1).map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <Card 
                  key={`month-stat-${cb.currency}`} 
                  className={cn(
                    "bg-gradient-to-br",
                    cb.netBalance > 0 
                      ? "from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-200 dark:border-orange-800"
                      : "from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-800"
                  )}
                >
                  <CardContent className="pt-4 pb-3 text-center">
                    <DollarSign className={cn("h-6 w-6 mx-auto mb-2", cb.netBalance > 0 ? "text-orange-500" : "text-green-500")} />
                    <p className={cn("text-2xl font-bold", cb.netBalance > 0 ? "text-orange-600" : "text-green-600")}>
                      {symbol}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cb.netBalance > 0 ? (t('thisMonthDebt') || 'Bu Ay Borç') : (t('credit') || 'Alacak')}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <CheckCircle className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-lg font-bold text-gray-500">{t('settled') || '✓'}</p>
                <p className="text-xs text-muted-foreground">{t('noDebt') || 'Bakiye yok'}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Financial Summary - Simplified */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('financialSummary') || 'Finansal Özet'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Current month breakdown per currency */}
            {currentMonthBalances.map(cb => {
              const symbol = getCurrencySymbol(cb.currency);
              return (
                <div key={`summary-${cb.currency}`} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono">{cb.currency}</Badge>
                    <span className={cn(
                      "font-bold text-lg",
                      cb.netBalance > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                      {cb.netBalance > 0 ? '' : '-'}{symbol}{Math.abs(cb.netBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('agencyExpense') || 'Gider'}</p>
                      <p className="font-medium">{symbol}{cb.totalCompanyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('passengerCash') || 'Nakit'}</p>
                      <p className="font-medium text-green-600">-{symbol}{cb.totalPassengerCash.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('paid') || 'Ödenen'}</p>
                      <p className="font-medium text-green-600">-{symbol}{cb.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentMonthBalances.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                {t('noActivityThisMonth') || 'Bu ay için aktivite yok'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('recentBalanceTransactions') || 'Son İşlemler'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.type === 'top_up' ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                      )}>
                        {tx.type === 'top_up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {tx.type === 'top_up' ? t('balanceTopUp') || 'Ödeme' : t('deduction') || 'Kesinti'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM HH:mm', { locale })}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "font-bold",
                      tx.type === 'top_up' ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.type === 'top_up' ? '+' : '-'}{getCurrencySymbol(tx.currency)}{Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
              {transactions.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-3"
                  onClick={() => navigate('/agency/transactions')}
                >
                  {t('viewAll') || 'Tümünü Gör'} ({transactions.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AgencyReports;
