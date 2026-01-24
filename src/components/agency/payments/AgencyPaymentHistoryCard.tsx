import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  Banknote,
  ChevronRight,
  MapPin,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';
import { AgencyPaymentHistoryItem } from '@/hooks/useAgencyPayments';
import { motion } from 'framer-motion';
import { generatePaymentReceipt } from '@/utils/generatePaymentReceipt';
import { toast } from 'sonner';

interface AgencyPaymentHistoryCardProps {
  reservation: AgencyPaymentHistoryItem;
  index: number;
  onClick: () => void;
  language: 'TR' | 'EN';
  agencyName?: string;
}

const translations = {
  EN: {
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    customer: 'Customer',
    paidAt: 'Paid at',
    downloadReceipt: 'Download Receipt',
    receiptDownloaded: 'Receipt downloaded successfully',
  },
  TR: {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    customer: 'Müşteri',
    paidAt: 'Ödeme',
    downloadReceipt: 'Makbuz İndir',
    receiptDownloaded: 'Makbuz başarıyla indirildi',
  }
};

export const AgencyPaymentHistoryCard = ({ 
  reservation, 
  index, 
  onClick,
  language,
  agencyName
}: AgencyPaymentHistoryCardProps) => {
  const t = translations[language];
  const dateLocale = language === 'TR' ? tr : enUS;

  const getCompanyAmount = (): number => {
    return reservation.agency_reservation_details?.company_amount || reservation.price || 0;
  };

  const getCurrency = (): string => {
    return reservation.agency_reservation_details?.agency_price_currency || reservation.price_currency || 'EUR';
  };

  const getPaymentStatus = (): string | null => {
    return reservation.agency_reservation_details?.payment_status || reservation.payment_status;
  };

  const status = getPaymentStatus();
  const provider = reservation.payment_provider;

  const getPaymentStatusBadge = () => {
    if (status === 'paid') {
      return (
        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.paid} {provider && `(${provider})`}
        </Badge>
      );
    }
    if (status === 'pay_on_transfer' || reservation.payment_status === 'pay_on_transfer') {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
          <Banknote className="h-3 w-3 mr-1" />
          {t.cashToDriver}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const displayPickup = reservation.pickup_place_name || reservation.pickup;
  const displayDropoff = reservation.dropoff_place_name || reservation.dropoff;

  const handleDownloadReceipt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow receipt download for paid online payments (Stripe/PayPal)
    if (status !== 'paid' || !['stripe', 'paypal'].includes(reservation.payment_provider || '')) {
      return;
    }
    
    try {
      await generatePaymentReceipt({
        reservationCode: reservation.reservation_code || 'N/A',
        customerName: reservation.customer_name,
        pickup: displayPickup,
        dropoff: displayDropoff,
        pickupDate: reservation.pickup_date,
        pickupTime: reservation.pickup_time,
        amount: getCompanyAmount(),
        currency: getCurrency(),
        paymentMethod: reservation.payment_provider,
        paymentDate: reservation.payment_completed_at,
        paymentStatus: status || 'pending',
        language,
        isAgency: true,
        agencyName: agencyName,
      });
      toast.success(t.receiptDownloaded);
    } catch (error) {
      console.error('Failed to generate receipt:', error);
    }
  };

  // Only show receipt button for paid online payments (Stripe/PayPal)
  const canDownloadReceipt = status === 'paid' && 
    ['stripe', 'paypal'].includes(reservation.payment_provider || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {reservation.reservation_code && (
                  <Badge variant="outline" className="text-xs font-mono">
                    #{reservation.reservation_code}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale: dateLocale })}
                </span>
              </div>
              
              {/* Route */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium line-clamp-2">
                  {displayPickup} → {displayDropoff}
                </p>
              </div>
              
              {/* Customer */}
              <p className="text-xs text-muted-foreground">
                {t.customer}: {reservation.customer_name}
              </p>
              
              {/* Amount and Status Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-primary">
                  {formatCurrency(getCompanyAmount(), getCurrency())}
                </span>
                {getPaymentStatusBadge()}
              </div>
              
              {/* Payment Date */}
              {reservation.payment_completed_at && (
                <p className="text-xs text-muted-foreground">
                  {t.paidAt}: {format(new Date(reservation.payment_completed_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                </p>
              )}

              {/* Download Receipt Button */}
              {canDownloadReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 text-xs h-7"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {t.downloadReceipt}
                </Button>
              )}
            </div>
            
            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
