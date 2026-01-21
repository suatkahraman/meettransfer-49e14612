import { useState, useMemo, useCallback, memo } from "react";
import { CreditCard, Wallet, Banknote, AlertCircle, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePayments } from "@/hooks/usePayments";
import { useReservationPayment } from "@/hooks/useReservationPayment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import type { PaymentProvider, PaymentStatus, SupportedCurrency } from "@/config/payments";

// Unified translations interface
export interface PaymentPanelTranslations {
  payment?: string;
  paymentStatus?: string;
  total?: string;
  paid?: string;
  cashToDriver?: string;
  toBePaid?: string;
  creditCard?: string;
  visaMastercard?: string;
  paypal?: string;
  fastSecure?: string;
  payOnTransfer?: string;
  payOnTransferDay?: string;
  confirmCashPayment?: string;
  pay?: string;
  processing?: string;
  paymentOptional?: string;
  onlineNotAvailable?: string;
  paymentComplete?: string;
  openPaymentLink?: string;
  existingPaymentLink?: string;
}

// Default English translations
const DEFAULT_TRANSLATIONS: Required<PaymentPanelTranslations> = {
  payment: 'Payment',
  paymentStatus: 'Payment Status',
  total: 'Total',
  paid: 'paid',
  cashToDriver: 'Cash to Driver',
  toBePaid: 'to be paid to driver',
  creditCard: 'Credit/Debit Card',
  visaMastercard: 'Visa, Mastercard, etc.',
  paypal: 'PayPal',
  fastSecure: 'Fast & secure',
  payOnTransfer: 'Cash to Driver',
  payOnTransferDay: 'Pay on transfer day',
  confirmCashPayment: 'Confirm Cash Payment',
  pay: 'Pay',
  processing: 'Processing...',
  paymentOptional: 'Payment is optional. You can also pay later or on transfer day.',
  onlineNotAvailable: 'Online payments are not available. You can pay cash to the driver on transfer day.',
  paymentComplete: 'Payment Complete',
  openPaymentLink: 'Open Payment Link',
  existingPaymentLink: 'Payment link available for customer',
};

// Turkish translations preset
export const TURKISH_TRANSLATIONS: Required<PaymentPanelTranslations> = {
  payment: 'Ödeme',
  paymentStatus: 'Ödeme Durumu',
  total: 'Toplam',
  paid: 'ödendi',
  cashToDriver: 'Şoföre Nakit',
  toBePaid: 'şoföre ödenecek',
  creditCard: 'Kredi/Banka Kartı',
  visaMastercard: 'Visa, Mastercard, vb.',
  paypal: 'PayPal',
  fastSecure: 'Hızlı ve güvenli',
  payOnTransfer: 'Şoföre Nakit',
  payOnTransferDay: 'Transfer gününde ödeme',
  confirmCashPayment: 'Nakit Ödemeyi Onayla',
  pay: 'Öde',
  processing: 'İşleniyor...',
  paymentOptional: 'Ödeme isteğe bağlıdır. Daha sonra veya transfer gününde de ödeyebilirsiniz.',
  onlineNotAvailable: 'Online ödeme şu anda mevcut değil. Transfer gününde şoföre nakit ödeme yapabilirsiniz.',
  paymentComplete: 'Ödeme Tamamlandı',
  openPaymentLink: 'Ödeme Linkini Aç',
  existingPaymentLink: 'Müşteri için ödeme linki mevcut',
};

export interface UnifiedPaymentPanelProps {
  reservationId: string;
  amount: number;
  currency: SupportedCurrency;
  currentStatus?: PaymentStatus | null;
  partialAmount?: number | null;
  paymentLink?: string | null;
  customerEmail?: string;
  customerName?: string;
  onPaymentComplete?: () => void;
  className?: string;
  translations?: PaymentPanelTranslations;
  showPaymentLink?: boolean;
  variant?: 'default' | 'compact';
}

type PaymentOption = PaymentProvider | 'pay_on_transfer';

// Memoized payment option component
const PaymentOptionItem = memo(({ 
  value, 
  icon: Icon, 
  title, 
  description,
  disabled = false,
}: { 
  value: string; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  disabled?: boolean;
}) => (
  <div className={cn(
    "flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors",
    disabled && "opacity-50 cursor-not-allowed"
  )}>
    <RadioGroupItem value={value} id={value} disabled={disabled} />
    <Label htmlFor={value} className={cn(
      "flex items-center gap-2 flex-1",
      disabled ? "cursor-not-allowed" : "cursor-pointer"
    )}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </Label>
  </div>
));

PaymentOptionItem.displayName = 'PaymentOptionItem';

// Memoized success state component
const PaymentSuccessState = memo(({ 
  amount, 
  currency, 
  label, 
  subLabel,
  variant = 'success',
  className,
}: { 
  amount: number; 
  currency: string; 
  label: string; 
  subLabel: string;
  variant?: 'success' | 'info';
  className?: string;
}) => {
  const colors = variant === 'success' 
    ? {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-950/30',
        iconBg: 'bg-green-100 dark:bg-green-900',
        iconColor: 'text-green-600',
        textPrimary: 'text-green-800 dark:text-green-200',
        textSecondary: 'text-green-600 dark:text-green-400',
      }
    : {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900',
        iconColor: 'text-blue-600',
        textPrimary: 'text-blue-800 dark:text-blue-200',
        textSecondary: 'text-blue-600 dark:text-blue-400',
      };

  const Icon = variant === 'success' ? CreditCard : Banknote;

  return (
    <Card className={cn(colors.border, colors.bg, className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colors.iconBg)}>
            <Icon className={cn("h-5 w-5", colors.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className={cn("font-medium", colors.textPrimary)}>{label}</p>
            <p className={cn("text-sm truncate", colors.textSecondary)}>
              {getCurrencySymbol(currency)}{amount.toFixed(2)} {subLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PaymentSuccessState.displayName = 'PaymentSuccessState';

// Main unified payment panel
export const UnifiedPaymentPanel = memo(({
  reservationId,
  amount,
  currency,
  currentStatus,
  partialAmount,
  paymentLink,
  customerEmail,
  customerName,
  onPaymentComplete,
  className,
  translations = {},
  showPaymentLink = true,
  variant = 'default',
}: UnifiedPaymentPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  
  const { 
    isLoading: isPaymentLoading, 
    isPaymentsEnabled, 
    isStripeEnabled, 
    isPayPalEnabled, 
    redirectToPayment 
  } = usePayments();
  
  const { 
    isLoading: isStatusLoading, 
    canAccessPayments, 
    markPayOnTransfer 
  } = useReservationPayment();

  // Memoize translations merge
  const t = useMemo(() => ({
    ...DEFAULT_TRANSLATIONS,
    ...translations,
  }), [translations]);

  // Memoize computed values
  const isLoading = isPaymentLoading || isStatusLoading;
  const hasOnlinePaymentOptions = useMemo(
    () => isPaymentsEnabled && (isStripeEnabled || isPayPalEnabled),
    [isPaymentsEnabled, isStripeEnabled, isPayPalEnabled]
  );

  // Memoize formatted amounts
  const formattedAmount = useMemo(
    () => `${getCurrencySymbol(currency)}${amount.toFixed(2)}`,
    [currency, amount]
  );

  const formattedPartialAmount = useMemo(
    () => partialAmount ? `${getCurrencySymbol(currency)}${partialAmount.toFixed(2)}` : null,
    [currency, partialAmount]
  );

  // Memoize payment handler
  const handlePayment = useCallback(async () => {
    if (!selectedOption) return;

    if (selectedOption === 'pay_on_transfer') {
      const success = await markPayOnTransfer(reservationId);
      if (success) {
        onPaymentComplete?.();
      }
      return;
    }

    // Online payment
    await redirectToPayment(selectedOption, {
      amount,
      currency,
      reservationId,
      customerEmail,
      customerName,
      description: `Transfer reservation payment`,
    });
  }, [selectedOption, reservationId, amount, currency, customerEmail, customerName, markPayOnTransfer, redirectToPayment, onPaymentComplete]);

  // Button text logic
  const buttonText = useMemo(() => {
    if (isLoading) return t.processing;
    if (selectedOption === 'pay_on_transfer') return t.confirmCashPayment;
    return `${t.pay} ${formattedAmount}`;
  }, [isLoading, selectedOption, t.processing, t.confirmCashPayment, t.pay, formattedAmount]);

  // If user can't access payments, don't render
  if (!canAccessPayments) {
    return null;
  }

  // If already paid, show success state
  if (currentStatus === 'paid') {
    return (
      <PaymentSuccessState
        amount={amount}
        currency={currency}
        label={t.paymentComplete}
        subLabel={t.paid}
        variant="success"
        className={className}
      />
    );
  }

  // If pay on transfer selected, show that
  if (currentStatus === 'pay_on_transfer') {
    return (
      <PaymentSuccessState
        amount={amount}
        currency={currency}
        label={t.cashToDriver}
        subLabel={t.toBePaid}
        variant="info"
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={variant === 'compact' ? 'pb-2' : undefined}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg">{t.payment}</CardTitle>
            <CardDescription className="truncate">
              {t.total}: {formattedAmount}
              {currentStatus === 'partial' && formattedPartialAmount && (
                <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                  ({formattedPartialAmount} {t.paid})
                </span>
              )}
            </CardDescription>
          </div>
          <PaymentStatusBadge status={currentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show existing payment link if available */}
        {showPaymentLink && paymentLink && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Link2 className="h-4 w-4 text-blue-600 shrink-0" />
            <AlertDescription className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-blue-700 dark:text-blue-300 text-sm">{t.existingPaymentLink}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLink, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t.openPaymentLink}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!hasOnlinePaymentOptions && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.onlineNotAvailable}</AlertDescription>
          </Alert>
        )}

        <RadioGroup 
          value={selectedOption || ''} 
          onValueChange={(v) => setSelectedOption(v as PaymentOption)}
          className="space-y-2"
        >
          {isStripeEnabled && (
            <PaymentOptionItem
              value="stripe"
              icon={CreditCard}
              title={t.creditCard}
              description={t.visaMastercard}
            />
          )}

          {isPayPalEnabled && (
            <PaymentOptionItem
              value="paypal"
              icon={Wallet}
              title={t.paypal}
              description={t.fastSecure}
            />
          )}

          {/* Always show cash option */}
          <PaymentOptionItem
            value="pay_on_transfer"
            icon={Banknote}
            title={t.payOnTransfer}
            description={t.payOnTransferDay}
          />
        </RadioGroup>

        <Button
          onClick={handlePayment}
          disabled={!selectedOption || isLoading}
          className="w-full"
          size={variant === 'compact' ? 'default' : 'lg'}
        >
          {buttonText}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t.paymentOptional}
        </p>
      </CardContent>
    </Card>
  );
});

UnifiedPaymentPanel.displayName = 'UnifiedPaymentPanel';

export default UnifiedPaymentPanel;
