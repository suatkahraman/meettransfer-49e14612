import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Banknote, ChevronRight, Download, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { PaymentHistoryItem } from '@/hooks/useCustomerPayments';
import { generatePaymentReceipt } from '@/utils/generatePaymentReceipt';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePayments } from '@/hooks/usePayments';

interface PaymentHistoryCardProps {
  reservation: PaymentHistoryItem;
  index: number;
  language: 'TR' | 'EN';
  onRefresh?: () => void;
}

const translations = {
  EN: {
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    downloadReceipt: 'Download Receipt',
    receiptDownloaded: 'Receipt downloaded successfully',
    payNow: 'Pay Now',
    switchToOnline: 'Pay with Card',
    switching: 'Switching...',
    switchSuccess: 'Payment method updated',
    switchError: 'Failed to update',
  },
  TR: {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    downloadReceipt: 'Makbuz İndir',
    receiptDownloaded: 'Makbuz başarıyla indirildi',
    payNow: 'Şimdi Öde',
    switchToOnline: 'Kartla Öde',
    switching: 'Değiştiriliyor...',
    switchSuccess: 'Ödeme yöntemi güncellendi',
    switchError: 'Güncelleme başarısız',
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

export const PaymentHistoryCard = ({ reservation, index, language, onRefresh }: PaymentHistoryCardProps) => {
  const navigate = useNavigate();
  const t = translations[language];
  const dateLocale = language === 'TR' ? tr : enUS;
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  const { isStripeEnabled } = usePayments();

  // Check if can switch to online payment (cash reservations that aren't paid)
  const canSwitchToOnline = isStripeEnabled && 
    reservation.payment_status !== 'paid' &&
    (reservation.payment_type === 'cash' || reservation.payment_status === 'pay_on_transfer');

  // Check if can pay now (online payment type but not yet paid)
  const canPayNow = isStripeEnabled &&
    reservation.payment_status !== 'paid' &&
    reservation.payment_status !== 'pay_on_transfer' &&
    (reservation.payment_type === 'online' || reservation.payment_type === 'payment_link' || reservation.payment_type === 'stripe') &&
    reservation.price && reservation.price > 0;

  const handleSwitchToOnline = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSwitching(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          payment_type: 'online',
          payment_status: 'pending',
          payment_provider: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      if (error) throw error;
      
      toast.success(t.switchSuccess);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to switch payment method:', error);
      toast.error(t.switchError);
    } finally {
      setIsSwitching(false);
    }
  }, [reservation.id, t, onRefresh]);

  const handlePayNow = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaymentProcessing(true);

    try {
      const result = await supabase.functions.invoke("create-stripe-checkout", {
        body: {
          reservationId: reservation.id,
          amount: reservation.price,
          currency: reservation.price_currency || 'EUR',
          description: `Transfer reservation #${reservation.reservation_code || reservation.id.slice(0, 8)}`,
          successUrl: `${window.location.origin}/customer/payments?success=true`,
          cancelUrl: `${window.location.origin}/customer/payments?cancelled=true`,
        },
      });

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(result.data?.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(t.switchError);
      setIsPaymentProcessing(false);
    }
  }, [reservation, t]);

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
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Pay Now Button for online payment reservations */}
                {canPayNow && (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handlePayNow}
                    disabled={isPaymentProcessing}
                  >
                    {isPaymentProcessing ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="h-3 w-3 mr-1" />
                    )}
                    {isPaymentProcessing ? t.switching : t.payNow}
                  </Button>
                )}

                {/* Switch to Online Payment Button for cash reservations */}
                {canSwitchToOnline && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleSwitchToOnline}
                    disabled={isSwitching}
                  >
                    {isSwitching ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="h-3 w-3 mr-1" />
                    )}
                    {isSwitching ? t.switching : t.switchToOnline}
                  </Button>
                )}

                {/* Download Receipt Button */}
                {canDownloadReceipt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleDownloadReceipt}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    {t.downloadReceipt}
                  </Button>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
