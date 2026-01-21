import { useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayments } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";
import type { PaymentProvider, SupportedCurrency } from "@/config/payments";

interface PaymentMethodSelectorProps {
  amount: number;
  currency: SupportedCurrency;
  reservationId?: string;
  quickBookingId?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  onPaymentInitiated?: (provider: PaymentProvider) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const PaymentMethodSelector = ({
  amount,
  currency,
  reservationId,
  quickBookingId,
  customerEmail,
  customerName,
  description,
  onPaymentInitiated,
  onError,
  className,
}: PaymentMethodSelectorProps) => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const { 
    isLoading, 
    isPaymentsEnabled, 
    isStripeEnabled, 
    isPayPalEnabled, 
    redirectToPayment 
  } = usePayments();

  // If payments are disabled, show a message
  if (!isPaymentsEnabled) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Online payments are not available at this time.
            Please use the payment link provided or pay cash to driver.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePayment = async () => {
    if (!selectedProvider) return;

    onPaymentInitiated?.(selectedProvider);

    await redirectToPayment(selectedProvider, {
      amount,
      currency,
      reservationId,
      quickBookingId,
      customerEmail,
      customerName,
      description,
    });
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case "EUR": return "€";
      case "USD": return "$";
      case "GBP": return "£";
      case "AED": return "د.إ";
      case "AUD": return "A$";
      case "TRY": return "₺";
      default: return curr;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Select Payment Method</CardTitle>
        <CardDescription>
          Total: {getCurrencySymbol(currency)}{amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {isStripeEnabled && (
            <button
              onClick={() => setSelectedProvider("stripe")}
              className={cn(
                "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                selectedProvider === "stripe"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <CreditCard className="h-8 w-8" />
              <span className="font-medium">Credit Card</span>
              <span className="text-xs text-muted-foreground">Visa, Mastercard, etc.</span>
            </button>
          )}

          {isPayPalEnabled && (
            <button
              onClick={() => setSelectedProvider("paypal")}
              className={cn(
                "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                selectedProvider === "paypal"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Wallet className="h-8 w-8" />
              <span className="font-medium">PayPal</span>
              <span className="text-xs text-muted-foreground">Fast & secure</span>
            </button>
          )}
        </div>

        <Button
          onClick={handlePayment}
          disabled={!selectedProvider || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Processing..." : `Pay ${getCurrencySymbol(currency)}${amount.toFixed(2)}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment processed by {selectedProvider === "stripe" ? "Stripe" : "PayPal"}
        </p>
      </CardContent>
    </Card>
  );
};
