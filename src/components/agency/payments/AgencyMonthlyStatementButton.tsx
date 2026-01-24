import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateAgencyMonthlyStatement } from '@/utils/generateAgencyMonthlyStatement';
import { AgencyPaymentHistoryItem } from '@/hooks/useAgencyPayments';

interface AgencyMonthlyStatementButtonProps {
  agencyName: string;
  paidReservations: AgencyPaymentHistoryItem[];
  language: 'TR' | 'EN';
  getCompanyAmount: (r: AgencyPaymentHistoryItem) => number;
  getCurrency: (r: AgencyPaymentHistoryItem) => string;
}

const translations = {
  TR: {
    monthlyStatement: 'Aylık Hesap Özeti',
    selectMonth: 'Ay Seçin',
    download: 'İndir',
    downloading: 'İndiriliyor...',
    success: 'Aylık özet başarıyla indirildi',
    noData: 'Bu ay için online ödeme bulunamadı',
  },
  EN: {
    monthlyStatement: 'Monthly Statement',
    selectMonth: 'Select Month',
    download: 'Download',
    downloading: 'Downloading...',
    success: 'Monthly statement downloaded successfully',
    noData: 'No online payments found for this month',
  }
};

export const AgencyMonthlyStatementButton = ({
  agencyName,
  paidReservations,
  language,
  getCompanyAmount,
  getCurrency,
}: AgencyMonthlyStatementButtonProps) => {
  const t = translations[language];
  const dateLocale = language === 'TR' ? tr : enUS;
  
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: dateLocale }),
      date,
    };
  });

  const handleDownload = async () => {
    if (!selectedMonth) {
      toast.error(t.selectMonth);
      return;
    }

    const selectedDate = monthOptions.find(m => m.value === selectedMonth)?.date;
    if (!selectedDate) return;

    setIsDownloading(true);

    try {
      // Filter reservations for the selected month - only paid online payments
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      const monthReservations = paidReservations
        .filter(r => {
          if (!r.payment_completed_at) return false;
          const paymentDate = new Date(r.payment_completed_at);
          return paymentDate >= monthStart && 
                 paymentDate <= monthEnd && 
                 (r.payment_status === 'paid' || r.agency_reservation_details?.payment_status === 'paid') &&
                 ['stripe', 'paypal'].includes(r.payment_provider || '');
        })
        .map(r => ({
          reservation_code: r.reservation_code,
          pickup: r.pickup,
          dropoff: r.dropoff,
          pickup_place_name: r.pickup_place_name,
          dropoff_place_name: r.dropoff_place_name,
          pickup_date: r.pickup_date,
          customer_name: r.customer_name,
          amount: getCompanyAmount(r),
          currency: getCurrency(r),
          payment_status: r.agency_reservation_details?.payment_status || r.payment_status || 'pending',
          payment_provider: r.payment_provider,
          payment_completed_at: r.payment_completed_at,
        }));

      if (monthReservations.length === 0) {
        toast.info(t.noData);
        setIsDownloading(false);
        return;
      }

      await generateAgencyMonthlyStatement({
        agencyName,
        month: selectedDate,
        reservations: monthReservations,
        language,
      });

      toast.success(t.success);
    } catch (error) {
      console.error('Failed to generate statement:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="h-4 w-4" />
        {t.monthlyStatement}
      </div>
      <div className="flex-1 flex gap-2">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder={t.selectMonth} />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={!selectedMonth || isDownloading}
          className="h-9"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          {isDownloading ? t.downloading : t.download}
        </Button>
      </div>
    </div>
  );
};
