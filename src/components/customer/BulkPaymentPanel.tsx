import { useState, useMemo, useCallback, memo } from "react";
import { CreditCard, Wallet, Banknote, Check, AlertCircle, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePayments } from "@/hooks/usePayments";
import { useReservationPayment } from "@/hooks/useReservationPayment";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentProvider, SupportedCurrency } from "@/config/payments";

export interface PayableReservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  price: number | null;
  price_currency: string | null;
  payment_status: string | null;
  status: string;
}

interface BulkPaymentTranslations {
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
  selectAll: string;
  deselectAll: string;
  securePayment: string;
  step1: string;
  step2: string;
  step3: string;
}

const TRANSLATIONS: Record<'EN' | 'TR', BulkPaymentTranslations> = {
  EN: {
    title: "Pay Reservations",
    selectReservations: "Select reservations to pay",
    selectedCount: "selected",
    totalAmount: "Total",
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
    selectPaymentMethod: "Select payment method",
    selectAtLeastOne: "Select at least one reservation",
    paymentSuccess: "Payment recorded successfully",
    paymentError: "Failed to process payment",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    securePayment: "Secure payment",
    step1: "Select",
    step2: "Method",
    step3: "Pay",
  },
  TR: {
    title: "Rezervasyon Öde",
    selectReservations: "Ödemek istediğiniz rezervasyonları seçin",
    selectedCount: "seçili",
    totalAmount: "Toplam",
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
    selectAll: "Tümünü Seç",
    deselectAll: "Seçimi Kaldır",
    securePayment: "Güvenli ödeme",
    step1: "Seç",
    step2: "Yöntem",
    step3: "Öde",
  },
};

type PaymentOption = PaymentProvider | 'pay_on_transfer';

interface ReservationItemProps {
  reservation: PayableReservation;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ReservationItem = memo(({ reservation, isSelected, onToggle }: ReservationItemProps) => {
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(reservation.pickup_date), 'dd MMM');
    } catch {
      return reservation.pickup_date;
    }
  }, [reservation.pickup_date]);

  const formattedPrice = useMemo(() => 
    formatCurrency(reservation.price, reservation.price_currency),
    [reservation.price, reservation.price_currency]
  );

  const displayPickup = reservation.pickup_place_name || reservation.pickup;
  const displayDropoff = reservation.dropoff_place_name || reservation.dropoff;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
        isSelected 
          ? "border-primary bg-primary/5 shadow-md" 
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={() => onToggle(reservation.id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(reservation.id)}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {reservation.reservation_code && (
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
              #{reservation.reservation_code}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
        </div>
        <p className="text-sm font-medium truncate leading-tight">
          {displayPickup} → {displayDropoff}
        </p>
      </div>
      <div className="text-right shrink-0">
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

ReservationItem.displayName = 'ReservationItem';

interface BulkPaymentPanelProps {
  reservations: PayableReservation[];
  onPaymentComplete?: () => void;
  className?: string;
  language?: 'TR' | 'EN';
}

export const BulkPaymentPanel = memo(({
  reservations,
  onPaymentComplete,
  className,
  language = 'EN',
}: BulkPaymentPanelProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = TRANSLATIONS[language];

  const { 
    isPaymentsEnabled, 
    isStripeEnabled, 
    isPayPalEnabled,
  } = usePayments();

  const { markPayOnTransfer } = useReservationPayment();

  // Filter payable reservations
  const payableReservations = useMemo(() => 
    reservations.filter(r => 
      r.price && 
      r.price > 0 && 
      r.payment_status !== 'paid' &&
      !['cancelled', 'cancelled_by_customer', 'customer_rejected'].includes(r.status)
    ),
    [reservations]
  );

  // Calculate total for selected
  const { totalAmount, currency } = useMemo(() => {
    const selected = payableReservations.filter(r => selectedIds.has(r.id));
    const total = selected.reduce((sum, r) => sum + (r.price || 0), 0);
    const curr = selected[0]?.price_currency || 'EUR';
    return { totalAmount: total, currency: curr as SupportedCurrency };
  }, [payableReservations, selectedIds]);

  const selectedCount = selectedIds.size;
  const hasOnlinePaymentOptions = isPaymentsEnabled && (isStripeEnabled || isPayPalEnabled);

  // Calculate current step for progress
  const currentStep = useMemo(() => {
    if (selectedCount === 0) return 1;
    if (!selectedPaymentMethod) return 2;
    return 3;
  }, [selectedCount, selectedPaymentMethod]);

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

  const toggleAll = useCallback(() => {
    if (selectedIds.size === payableReservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payableReservations.map(r => r.id)));
    }
  }, [payableReservations, selectedIds.size]);

  const handlePayment = useCallback(async () => {
    if (selectedCount === 0 || !selectedPaymentMethod) return;

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'pay_on_transfer') {
        const selectedReservations = payableReservations.filter(r => selectedIds.has(r.id));
        
        for (const reservation of selectedReservations) {
          await markPayOnTransfer(reservation.id);
        }
        
        toast.success(t.paymentSuccess);
        onPaymentComplete?.();
      } else {
        const selectedReservations = payableReservations.filter(r => selectedIds.has(r.id));
        sessionStorage.setItem('bulk_payment_reservations', JSON.stringify(selectedReservations.map(r => r.id)));

        const primaryReservation = selectedReservations[0];
        
        const result = await supabase.functions.invoke("create-stripe-checkout", {
          body: {
            reservationId: primaryReservation.id,
            amount: totalAmount,
            currency: currency,
            description: `Payment for ${selectedCount} transfer reservations`,
            successUrl: `${window.location.origin}/customer/payments?success=true`,
            cancelUrl: `${window.location.origin}/customer/payments?cancelled=true`,
            metadata: {
              bulk_payment: true,
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
      console.error('Bulk payment error:', error);
      toast.error(t.paymentError);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCount, selectedPaymentMethod, payableReservations, selectedIds, markPayOnTransfer, totalAmount, currency, t, onPaymentComplete]);

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
      <Card className={cn("border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800", className)}>
        <CardContent className="pt-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">{t.allPaid}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{t.noPayableReservations}</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription className="text-xs">{t.selectReservations}</CardDescription>
          </div>
          {selectedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Badge variant="default" className="text-sm px-3 py-1">
                {selectedCount} {t.selectedCount}
              </Badge>
            </motion.div>
          )}
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-3">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                currentStep >= step 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {step}
              </div>
              <span className={cn(
                "ml-1.5 text-xs hidden sm:inline",
                currentStep >= step ? "text-foreground" : "text-muted-foreground"
              )}>
                {step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}
              </span>
              {step < 3 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  currentStep > step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Select All Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
          className="w-full text-xs h-8"
        >
          {selectedIds.size === payableReservations.length ? (
            <><Minus className="h-3 w-3 mr-1.5" />{t.deselectAll}</>
          ) : (
            <><Plus className="h-3 w-3 mr-1.5" />{t.selectAll} ({payableReservations.length})</>
          )}
        </Button>

        {/* Reservation List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 -mr-1">
          <AnimatePresence>
            {payableReservations.map(reservation => (
              <ReservationItem
                key={reservation.id}
                reservation={reservation}
                isSelected={selectedIds.has(reservation.id)}
                onToggle={toggleReservation}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Total Amount Display */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.totalAmount}</span>
                <span className="text-2xl font-bold text-primary">
                  {getCurrencySymbol(currency)}{totalAmount.toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Method Selection */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {!hasOnlinePaymentOptions && (
                <Alert className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Online payments are not available. You can pay cash to the driver.
                  </AlertDescription>
                </Alert>
              )}

              <RadioGroup
                value={selectedPaymentMethod || ''}
                onValueChange={(v) => setSelectedPaymentMethod(v as PaymentOption)}
                className="space-y-2"
              >
                {isStripeEnabled && (
                  <Label
                    htmlFor="stripe-bulk"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      selectedPaymentMethod === 'stripe' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="stripe" id="stripe-bulk" />
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.creditCard}</p>
                      <p className="text-xs text-muted-foreground">{t.visaMastercard}</p>
                    </div>
                  </Label>
                )}

                {isPayPalEnabled && (
                  <Label
                    htmlFor="paypal-bulk"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      selectedPaymentMethod === 'paypal' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value="paypal" id="paypal-bulk" />
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.paypal}</p>
                      <p className="text-xs text-muted-foreground">{t.fastSecure}</p>
                    </div>
                  </Label>
                )}

                <Label
                  htmlFor="cash-bulk"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    selectedPaymentMethod === 'pay_on_transfer' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="pay_on_transfer" id="cash-bulk" />
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.payOnTransfer}</p>
                    <p className="text-xs text-muted-foreground">{t.payOnTransferDay}</p>
                  </div>
                </Label>
              </RadioGroup>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={isButtonDisabled}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isProcessing && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
});

BulkPaymentPanel.displayName = 'BulkPaymentPanel';

export default BulkPaymentPanel;
