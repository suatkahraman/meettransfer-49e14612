import { useState, useMemo, useCallback, memo } from "react";
import { CreditCard, Wallet, Banknote, Check, AlertCircle, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usePayments } from "@/hooks/usePayments";
import { useReservationPayment } from "@/hooks/useReservationPayment";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentProvider, SupportedCurrency } from "@/config/payments";

export interface AgencyPayableReservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  customer_name: string;
  // Agency-specific pricing
  agency_reservation_details?: {
    customer_price: number | null;
    company_amount: number | null;
    agency_price_currency: string | null;
    payment_status: string | null;
  } | null;
  // Fallback to regular price
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  status: string;
}

interface AgencyBulkPaymentTranslations {
  title: string;
  selectReservations: string;
  selectedCount: string;
  totalAmount: string;
  noPayableReservations: string;
  allPaid: string;
  creditCard: string;
  visaMastercard: string;
  paypal: string;
  fastSecure: string;
  payOnTransfer: string;
  payOnTransferDay: string;
  payNow: string;
  confirmCash: string;
  processing: string;
  selectPaymentMethod: string;
  selectAtLeastOne: string;
  paymentSuccess: string;
  paymentError: string;
  route: string;
  date: string;
  price: string;
  selectAll: string;
  deselectAll: string;
  customer: string;
  companyAmount: string;
}

const TURKISH_TRANSLATIONS: AgencyBulkPaymentTranslations = {
  title: "Çoklu Rezervasyon Ödemesi",
  selectReservations: "Ödemek istediğiniz rezervasyonları seçin",
  selectedCount: "seçili",
  totalAmount: "Toplam Tutar",
  noPayableReservations: "Ödenmemiş rezervasyon bulunamadı",
  allPaid: "Tüm rezervasyonlarınız ödendi!",
  creditCard: "Kredi/Banka Kartı",
  visaMastercard: "Visa, Mastercard, vb.",
  paypal: "PayPal",
  fastSecure: "Hızlı ve güvenli",
  payOnTransfer: "Şoföre Nakit",
  payOnTransferDay: "Transfer gününde ödeme",
  payNow: "Şimdi Öde",
  confirmCash: "Nakit Ödemeyi Onayla",
  processing: "İşleniyor...",
  selectPaymentMethod: "Ödeme yöntemi seçin",
  selectAtLeastOne: "En az bir rezervasyon seçin",
  paymentSuccess: "Ödeme başarıyla kaydedildi",
  paymentError: "Ödeme işlemi başarısız",
  route: "Güzergah",
  date: "Tarih",
  price: "Fiyat",
  selectAll: "Tümünü Seç",
  deselectAll: "Seçimi Kaldır",
  customer: "Müşteri",
  companyAmount: "Şirket Tutarı",
};

const ENGLISH_TRANSLATIONS: AgencyBulkPaymentTranslations = {
  title: "Pay Multiple Reservations",
  selectReservations: "Select reservations to pay",
  selectedCount: "selected",
  totalAmount: "Total Amount",
  noPayableReservations: "No unpaid reservations found",
  allPaid: "All your reservations are paid!",
  creditCard: "Credit/Debit Card",
  visaMastercard: "Visa, Mastercard, etc.",
  paypal: "PayPal",
  fastSecure: "Fast & secure",
  payOnTransfer: "Cash to Driver",
  payOnTransferDay: "Pay on transfer day",
  payNow: "Pay Now",
  confirmCash: "Confirm Cash Payment",
  processing: "Processing...",
  selectPaymentMethod: "Select a payment method",
  selectAtLeastOne: "Select at least one reservation",
  paymentSuccess: "Payment recorded successfully",
  paymentError: "Failed to process payment",
  route: "Route",
  date: "Date",
  price: "Price",
  selectAll: "Select All",
  deselectAll: "Deselect All",
  customer: "Customer",
  companyAmount: "Company Amount",
};

type PaymentOption = PaymentProvider | 'pay_on_transfer';

// Get the amount to pay for agency (company_amount from agency_reservation_details)
const getAgencyPayableAmount = (reservation: AgencyPayableReservation): number => {
  return reservation.agency_reservation_details?.company_amount || reservation.price || 0;
};

const getAgencyPaymentCurrency = (reservation: AgencyPayableReservation): string => {
  return reservation.agency_reservation_details?.agency_price_currency || reservation.price_currency || 'EUR';
};

const getAgencyPaymentStatus = (reservation: AgencyPayableReservation): string | null => {
  return reservation.agency_reservation_details?.payment_status || reservation.payment_status;
};

interface ReservationItemProps {
  reservation: AgencyPayableReservation;
  isSelected: boolean;
  onToggle: (id: string) => void;
  t: AgencyBulkPaymentTranslations;
}

const ReservationItem = memo(({ reservation, isSelected, onToggle, t }: ReservationItemProps) => {
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(reservation.pickup_date), 'dd MMM yyyy');
    } catch {
      return reservation.pickup_date;
    }
  }, [reservation.pickup_date]);

  const amount = getAgencyPayableAmount(reservation);
  const currency = getAgencyPaymentCurrency(reservation);
  const formattedPrice = useMemo(() => formatCurrency(amount, currency), [amount, currency]);

  const displayPickup = reservation.pickup_place_name || reservation.pickup;
  const displayDropoff = reservation.dropoff_place_name || reservation.dropoff;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        isSelected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={() => onToggle(reservation.id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(reservation.id)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {reservation.reservation_code && (
            <Badge variant="outline" className="text-xs">
              #{reservation.reservation_code}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <p className="text-sm font-medium truncate">
          {displayPickup} → {displayDropoff}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {t.customer}: {reservation.customer_name}
        </p>
        <p className="text-sm font-bold text-primary">{formattedPrice}</p>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0"
        >
          <Check className="h-4 w-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
});

ReservationItem.displayName = 'AgencyReservationItem';

interface AgencyBulkPaymentPanelProps {
  reservations: AgencyPayableReservation[];
  agencyId: string;
  onPaymentComplete?: () => void;
  className?: string;
  language?: 'TR' | 'EN';
}

export const AgencyBulkPaymentPanel = memo(({
  reservations,
  agencyId,
  onPaymentComplete,
  className,
  language = 'TR',
}: AgencyBulkPaymentPanelProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = useMemo(() => 
    language === 'TR' ? TURKISH_TRANSLATIONS : ENGLISH_TRANSLATIONS,
    [language]
  );

  const { 
    isPaymentsEnabled, 
    isStripeEnabled, 
    isPayPalEnabled,
  } = usePayments();

  const { markPayOnTransfer } = useReservationPayment();

  // Filter payable reservations (pending or not paid)
  const payableReservations = useMemo(() => 
    reservations.filter(r => {
      const amount = getAgencyPayableAmount(r);
      const paymentStatus = getAgencyPaymentStatus(r);
      return (
        amount > 0 && 
        paymentStatus !== 'paid' &&
        !['cancelled', 'cancelled_by_customer', 'customer_rejected'].includes(r.status)
      );
    }),
    [reservations]
  );

  // Calculate total for selected
  const { totalAmount, currency } = useMemo(() => {
    const selected = payableReservations.filter(r => selectedIds.has(r.id));
    const total = selected.reduce((sum, r) => sum + getAgencyPayableAmount(r), 0);
    const curr = selected[0] ? getAgencyPaymentCurrency(selected[0]) : 'EUR';
    return { totalAmount: total, currency: curr as SupportedCurrency };
  }, [payableReservations, selectedIds]);

  const selectedCount = selectedIds.size;
  const hasOnlinePaymentOptions = isPaymentsEnabled && (isStripeEnabled || isPayPalEnabled);

  const toggleReservation = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(payableReservations.map(r => r.id)));
  }, [payableReservations]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handlePayment = useCallback(async () => {
    if (selectedCount === 0 || !selectedPaymentMethod) return;

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'pay_on_transfer') {
        // Mark all selected as pay on transfer
        const selectedReservations = payableReservations.filter(r => selectedIds.has(r.id));
        
        for (const reservation of selectedReservations) {
          await markPayOnTransfer(reservation.id);
        }
        
        toast.success(t.paymentSuccess);
        onPaymentComplete?.();
      } else {
        // For online payment, create a bulk payment session
        const selectedReservations = payableReservations.filter(r => selectedIds.has(r.id));
        sessionStorage.setItem('agency_bulk_payment_reservations', JSON.stringify(selectedReservations.map(r => r.id)));

        // Create combined payment - use first reservation as primary
        const primaryReservation = selectedReservations[0];
        
        const result = await supabase.functions.invoke("create-stripe-checkout", {
          body: {
            reservationId: primaryReservation.id,
            amount: totalAmount,
            currency: currency,
            description: `Agency payment for ${selectedCount} transfer reservations`,
            successUrl: `${window.location.origin}/agency/payments?success=true`,
            cancelUrl: `${window.location.origin}/agency/payments?cancelled=true`,
            metadata: {
              bulk_payment: true,
              agency_payment: true,
              agency_id: agencyId,
              reservation_ids: selectedReservations.map(r => r.id).join(','),
            }
          },
        });

        if (result.data?.url) {
          window.location.href = result.data.url;
        } else {
          throw new Error(result.data?.error || 'Payment failed');
        }
      }
    } catch (error: any) {
      console.error('Agency bulk payment error:', error);
      toast.error(t.paymentError);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCount, selectedPaymentMethod, payableReservations, selectedIds, markPayOnTransfer, totalAmount, currency, t, onPaymentComplete, agencyId]);

  const buttonText = useMemo(() => {
    if (isProcessing) return t.processing;
    if (selectedCount === 0) return t.selectAtLeastOne;
    if (!selectedPaymentMethod) return t.selectPaymentMethod;
    if (selectedPaymentMethod === 'pay_on_transfer') return t.confirmCash;
    return `${t.payNow} ${getCurrencySymbol(currency)}${totalAmount.toFixed(2)}`;
  }, [isProcessing, selectedCount, selectedPaymentMethod, t, currency, totalAmount]);

  const isButtonDisabled = isProcessing || selectedCount === 0 || !selectedPaymentMethod;

  // No payable reservations
  if (payableReservations.length === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">{t.allPaid}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{t.noPayableReservations}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.selectReservations}</CardDescription>
          </div>
          {selectedCount > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedCount} {t.selectedCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select All / Deselect All */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectedIds.size === payableReservations.length ? deselectAll : selectAll}
            className="text-xs"
          >
            {selectedIds.size === payableReservations.length ? (
              <>
                <Minus className="h-3 w-3 mr-1" />
                {t.deselectAll}
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                {t.selectAll}
              </>
            )}
          </Button>
        </div>

        {/* Reservation List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <AnimatePresence>
            {payableReservations.map(reservation => (
              <ReservationItem
                key={reservation.id}
                reservation={reservation}
                isSelected={selectedIds.has(reservation.id)}
                onToggle={toggleReservation}
                t={t}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Total Amount Display */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-primary/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.totalAmount}</span>
              <span className="text-xl font-bold text-primary">
                {getCurrencySymbol(currency)}{totalAmount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Payment Method Selection */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {!hasOnlinePaymentOptions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'TR' 
                    ? 'Online ödemeler kullanılamıyor. Şoföre nakit ödeyebilirsiniz.'
                    : 'Online payments are not available. You can pay cash to the driver.'}
                </AlertDescription>
              </Alert>
            )}

            <RadioGroup
              value={selectedPaymentMethod || ''}
              onValueChange={(v) => setSelectedPaymentMethod(v as PaymentOption)}
              className="space-y-2"
            >
              {isStripeEnabled && (
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
                  selectedPaymentMethod === 'stripe' && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="stripe" id="stripe-agency-bulk" />
                  <Label htmlFor="stripe-agency-bulk" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <CreditCard className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{t.creditCard}</p>
                      <p className="text-xs text-muted-foreground">{t.visaMastercard}</p>
                    </div>
                  </Label>
                </div>
              )}

              {isPayPalEnabled && (
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
                  selectedPaymentMethod === 'paypal' && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="paypal" id="paypal-agency-bulk" />
                  <Label htmlFor="paypal-agency-bulk" className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Wallet className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{t.paypal}</p>
                      <p className="text-xs text-muted-foreground">{t.fastSecure}</p>
                    </div>
                  </Label>
                </div>
              )}

              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
                selectedPaymentMethod === 'pay_on_transfer' && "border-primary bg-primary/5"
              )}>
                <RadioGroupItem value="pay_on_transfer" id="cash-agency-bulk" />
                <Label htmlFor="cash-agency-bulk" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Banknote className="h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{t.payOnTransfer}</p>
                    <p className="text-xs text-muted-foreground">{t.payOnTransferDay}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={isButtonDisabled}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="mr-2"
                  >
                    ⏳
                  </motion.div>
                  {t.processing}
                </>
              ) : (
                buttonText
              )}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
});

AgencyBulkPaymentPanel.displayName = 'AgencyBulkPaymentPanel';

export default AgencyBulkPaymentPanel;
