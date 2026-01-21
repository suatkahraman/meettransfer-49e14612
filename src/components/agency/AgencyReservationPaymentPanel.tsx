import { useState } from "react";
import { CreditCard, Wallet, Banknote, AlertCircle, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePayments } from "@/hooks/usePayments";
import { useReservationPayment } from "@/hooks/useReservationPayment";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import type { PaymentProvider, PaymentStatus, SupportedCurrency } from "@/config/payments";

interface AgencyReservationPaymentPanelProps {
  reservationId: string;
  amount: number;
  currency: SupportedCurrency;
  currentStatus?: PaymentStatus | null;
  partialAmount?: number | null;
  paymentLink?: string | null;
  customerName?: string;
  onPaymentComplete?: () => void;
  className?: string;
  translations?: {
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
  };
}

type PaymentOption = PaymentProvider | 'pay_on_transfer';

export const AgencyReservationPaymentPanel = ({
  reservationId,
  amount,
  currency,
  currentStatus,
  partialAmount,
  paymentLink,
  customerName,
  onPaymentComplete,
  className,
  translations = {},
}: AgencyReservationPaymentPanelProps) => {
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

  const isLoading = isPaymentLoading || isStatusLoading;

  // Default translations
  const t = {
    payment: translations.payment || 'Ödeme',
    paymentStatus: translations.paymentStatus || 'Ödeme Durumu',
    total: translations.total || 'Toplam',
    paid: translations.paid || 'ödendi',
    cashToDriver: translations.cashToDriver || 'Şoföre Nakit',
    toBePaid: translations.toBePaid || 'şoföre ödenecek',
    creditCard: translations.creditCard || 'Kredi/Banka Kartı',
    visaMastercard: translations.visaMastercard || 'Visa, Mastercard, vb.',
    paypal: translations.paypal || 'PayPal',
    fastSecure: translations.fastSecure || 'Hızlı ve güvenli',
    payOnTransfer: translations.payOnTransfer || 'Şoföre Nakit',
    payOnTransferDay: translations.payOnTransferDay || 'Transfer gününde ödeme',
    confirmCashPayment: translations.confirmCashPayment || 'Nakit Ödemeyi Onayla',
    pay: translations.pay || 'Öde',
    processing: translations.processing || 'İşleniyor...',
    paymentOptional: translations.paymentOptional || 'Ödeme isteğe bağlıdır. Daha sonra veya transfer gününde de ödeyebilirsiniz.',
    onlineNotAvailable: translations.onlineNotAvailable || 'Online ödeme şu anda mevcut değil. Transfer gününde şoföre nakit ödeme yapabilirsiniz.',
    paymentComplete: translations.paymentComplete || 'Ödeme Tamamlandı',
    openPaymentLink: translations.openPaymentLink || 'Ödeme Linkini Aç',
    existingPaymentLink: translations.existingPaymentLink || 'Müşteri için ödeme linki mevcut',
  };

  // If user can't access payments, don't render
  if (!canAccessPayments) {
    return null;
  }

  // If already paid, show success state
  if (currentStatus === 'paid') {
    return (
      <Card className={cn("border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">{t.paymentComplete}</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {getCurrencySymbol(currency)}{amount.toFixed(2)} {t.paid}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If pay on transfer selected, show that
  if (currentStatus === 'pay_on_transfer') {
    return (
      <Card className={cn("border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">{t.cashToDriver}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {getCurrencySymbol(currency)}{amount.toFixed(2)} {t.toBePaid}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePayment = async () => {
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
      customerName,
      description: `Transfer reservation payment`,
    });
  };

  const hasOnlinePaymentOptions = isPaymentsEnabled && (isStripeEnabled || isPayPalEnabled);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t.payment}</CardTitle>
            <CardDescription>
              {t.total}: {getCurrencySymbol(currency)}{amount.toFixed(2)}
              {currentStatus === 'partial' && partialAmount && (
                <span className="text-yellow-600 ml-2">
                  ({getCurrencySymbol(currency)}{partialAmount.toFixed(2)} {t.paid})
                </span>
              )}
            </CardDescription>
          </div>
          <PaymentStatusBadge status={currentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show existing payment link if available */}
        {paymentLink && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Link2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-300">{t.existingPaymentLink}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentLink, '_blank')}
                className="ml-2"
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
            <AlertDescription>
              {t.onlineNotAvailable}
            </AlertDescription>
          </Alert>
        )}

        <RadioGroup 
          value={selectedOption || ''} 
          onValueChange={(v) => setSelectedOption(v as PaymentOption)}
        >
          {isStripeEnabled && (
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">{t.creditCard}</p>
                  <p className="text-xs text-muted-foreground">{t.visaMastercard}</p>
                </div>
              </Label>
            </div>
          )}

          {isPayPalEnabled && (
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                <Wallet className="h-5 w-5" />
                <div>
                  <p className="font-medium">{t.paypal}</p>
                  <p className="text-xs text-muted-foreground">{t.fastSecure}</p>
                </div>
              </Label>
            </div>
          )}

          {/* Always show cash option */}
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="pay_on_transfer" id="pay_on_transfer" />
            <Label htmlFor="pay_on_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
              <Banknote className="h-5 w-5" />
              <div>
                <p className="font-medium">{t.payOnTransfer}</p>
                <p className="text-xs text-muted-foreground">{t.payOnTransferDay}</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <Button
          onClick={handlePayment}
          disabled={!selectedOption || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading 
            ? t.processing
            : selectedOption === 'pay_on_transfer'
              ? t.confirmCashPayment
              : `${t.pay} ${getCurrencySymbol(currency)}${amount.toFixed(2)}`
          }
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t.paymentOptional}
        </p>
      </CardContent>
    </Card>
  );
};

export default AgencyReservationPaymentPanel;
