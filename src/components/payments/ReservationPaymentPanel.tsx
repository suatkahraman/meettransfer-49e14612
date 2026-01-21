import { useState, useEffect } from "react";
import { CreditCard, Wallet, Banknote, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePayments } from "@/hooks/usePayments";
import { useReservationPayment } from "@/hooks/useReservationPayment";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { cn } from "@/lib/utils";
import type { PaymentProvider, PaymentStatus, SupportedCurrency } from "@/config/payments";

interface ReservationPaymentPanelProps {
  reservationId: string;
  amount: number;
  currency: SupportedCurrency;
  currentStatus?: PaymentStatus | null;
  partialAmount?: number | null;
  customerEmail?: string;
  customerName?: string;
  onPaymentComplete?: () => void;
  className?: string;
}

type PaymentOption = PaymentProvider | 'pay_on_transfer';

export const ReservationPaymentPanel = ({
  reservationId,
  amount,
  currency,
  currentStatus,
  partialAmount,
  customerEmail,
  customerName,
  onPaymentComplete,
  className,
}: ReservationPaymentPanelProps) => {
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

  // If user can't access payments, don't render
  if (!canAccessPayments) {
    return null;
  }

  // If already paid, show success state
  if (currentStatus === 'paid') {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Payment Complete</p>
              <p className="text-sm text-green-600">
                {getCurrencySymbol(currency)}{amount.toFixed(2)} paid
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
      <Card className={cn("border-blue-200 bg-blue-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800">Cash to Driver</p>
              <p className="text-sm text-blue-600">
                {getCurrencySymbol(currency)}{amount.toFixed(2)} to be paid to driver
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
      customerEmail,
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
            <CardTitle className="text-lg">Payment</CardTitle>
            <CardDescription>
              Total: {getCurrencySymbol(currency)}{amount.toFixed(2)}
              {currentStatus === 'partial' && partialAmount && (
                <span className="text-yellow-600 ml-2">
                  ({getCurrencySymbol(currency)}{partialAmount.toFixed(2)} paid)
                </span>
              )}
            </CardDescription>
          </div>
          <PaymentStatusBadge status={currentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasOnlinePaymentOptions && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Online payments are not available. You can pay cash to the driver on transfer day.
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
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, etc.</p>
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
                  <p className="font-medium">PayPal</p>
                  <p className="text-xs text-muted-foreground">Fast & secure</p>
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
                <p className="font-medium">Cash to Driver</p>
                <p className="text-xs text-muted-foreground">Pay on transfer day</p>
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
            ? "Processing..." 
            : selectedOption === 'pay_on_transfer'
              ? "Confirm Cash Payment"
              : `Pay ${getCurrencySymbol(currency)}${amount.toFixed(2)}`
          }
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Payment is optional. You can also pay later or on transfer day.
        </p>
      </CardContent>
    </Card>
  );
};

function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "EUR": return "€";
    case "USD": return "$";
    case "GBP": return "£";
    case "AED": return "د.إ";
    case "AUD": return "A$";
    case "TRY": return "₺";
    default: return currency;
  }
}
