import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Banknote, ChevronRight, Download } from 'lucide-react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { PaymentHistoryItem } from '@/hooks/useCustomerPayments';
import { generatePaymentReceipt } from '@/utils/generatePaymentReceipt';
import { toast } from 'sonner';

interface PaymentHistoryCardProps {
  reservation: PaymentHistoryItem;
  index: number;
  language: 'TR' | 'EN';
}

const translations = {
  EN: {
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    downloadReceipt: 'Download Receipt',
    receiptDownloaded: 'Receipt downloaded successfully',
  },
  TR: {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    downloadReceipt: 'Makbuz İndir',
    receiptDownloaded: 'Makbuz başarıyla indirildi',
  }
};

export const getPaymentStatusBadge = (status: string | null, provider: string | null, t: typeof translations.EN) => {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t.paid} {provider && `(${provider})`}
      </Badge>
    );
  }
  if (status === 'pay_on_transfer') {
    return (
      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
        <Banknote className="h-3 w-3 mr-1" />
        {t.cashToDriver}
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
      <Clock className="h-3 w-3 mr-1" />
      {t.pending}
    </Badge>
  );
};

export const PaymentHistoryCard = ({ reservation, index, language }: PaymentHistoryCardProps) => {
  const navigate = useNavigate();
  const t = translations[language];
  const dateLocale = language === 'TR' ? tr : enUS;

  const handleDownloadReceipt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow receipt download for paid online payments
    if (reservation.payment_status !== 'paid' || !['stripe', 'paypal'].includes(reservation.payment_provider || '')) {
      return;
    }
    
    try {
      await generatePaymentReceipt({
        reservationCode: reservation.reservation_code || 'N/A',
        customerName: reservation.customer_name || 'Customer',
        pickup: reservation.pickup_place_name || reservation.pickup,
        dropoff: reservation.dropoff_place_name || reservation.dropoff,
        pickupDate: reservation.pickup_date,
        pickupTime: reservation.pickup_time,
        amount: reservation.price || 0,
        currency: reservation.price_currency || 'EUR',
        paymentMethod: reservation.payment_provider,
        paymentDate: reservation.payment_completed_at,
        paymentStatus: reservation.payment_status || 'pending',
        language,
        // Enhanced details
        vehicleType: reservation.vehicle_type,
        flightNumber: reservation.flight_number,
        luggageCount: reservation.luggage_count,
        babySeatCount: reservation.baby_seat_count,
      });
      toast.success(t.receiptDownloaded);
    } catch (error) {
      console.error('Failed to generate receipt:', error);
    }
  };

  // Only show receipt button for paid online payments (Stripe/PayPal)
  const canDownloadReceipt = reservation.payment_status === 'paid' && 
    ['stripe', 'paypal'].includes(reservation.payment_provider || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
        onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
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
              <p className="text-sm font-medium truncate">
                {reservation.pickup_place_name || reservation.pickup} → {reservation.dropoff_place_name || reservation.dropoff}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(reservation.price, reservation.price_currency)}
                </span>
                {getPaymentStatusBadge(reservation.payment_status, reservation.payment_provider, t)}
              </div>
              {reservation.payment_completed_at && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(reservation.payment_completed_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                </p>
              )}
              
              {/* Download Receipt Button */}
              {canDownloadReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {t.downloadReceipt}
                </Button>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
