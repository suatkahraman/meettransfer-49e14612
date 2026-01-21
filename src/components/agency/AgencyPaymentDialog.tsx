import { useState } from "react";
import { CreditCard, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePayments } from "@/hooks/usePayments";
import { getCurrencySymbol } from "@/lib/currency";
import type { PaymentProvider, SupportedCurrency } from "@/config/payments";

interface AgencyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: string;
  agencyId: string;
  onPaymentComplete?: () => void;
}

export const AgencyPaymentDialog = ({
  open,
  onOpenChange,
  amount,
  currency,
  agencyId,
  onPaymentComplete,
}: AgencyPaymentDialogProps) => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const { 
    isLoading, 
    isPaymentsEnabled, 
    isStripeEnabled, 
    isPayPalEnabled, 
    redirectToPayment 
  } = usePayments();

  const handlePayment = async () => {
    if (!selectedProvider || amount <= 0) return;

    // Pass agency context for payment tracking
    await redirectToPayment(selectedProvider, {
      agencyId,
      amount,
      currency: currency as SupportedCurrency,
      description: `Acenta bakiye ödemesi - ${getCurrencySymbol(currency)}${amount.toFixed(2)}`,
      successUrl: `${window.location.origin}/agency/payment-success?amount=${amount}&currency=${currency}&agency_id=${agencyId}`,
      cancelUrl: `${window.location.origin}/agency/transactions`,
    });
  };

  const hasOnlinePaymentOptions = isPaymentsEnabled && (isStripeEnabled || isPayPalEnabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bakiye Ödemesi</DialogTitle>
          <DialogDescription>
            Toplam borç: {getCurrencySymbol(currency)}{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasOnlinePaymentOptions ? (
            <Alert>
              <AlertDescription>
                Online ödeme sistemi şu anda aktif değil. Lütfen yönetici ile iletişime geçin.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <RadioGroup 
                value={selectedProvider || ''} 
                onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}
              >
                {isStripeEnabled && (
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <RadioGroupItem value="stripe" id="stripe-agency" />
                    <Label htmlFor="stripe-agency" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Kredi/Banka Kartı</p>
                        <p className="text-xs text-muted-foreground">Visa, Mastercard, vb.</p>
                      </div>
                    </Label>
                  </div>
                )}

                {isPayPalEnabled && (
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <RadioGroupItem value="paypal" id="paypal-agency" />
                    <Label htmlFor="paypal-agency" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-xs text-muted-foreground">Hızlı ve güvenli</p>
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              <Button
                onClick={handlePayment}
                disabled={!selectedProvider || isLoading || amount <= 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  `${getCurrencySymbol(currency)}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} Öde`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Güvenli ödeme {selectedProvider === "stripe" ? "Stripe" : "PayPal"} tarafından işlenir
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
