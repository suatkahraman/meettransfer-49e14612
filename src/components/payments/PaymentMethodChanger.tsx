/**
 * PaymentMethodChanger - Allows customers/agencies to change payment method
 * after a reservation is created (before payment is completed)
 */

import { useState, memo, useCallback } from "react";
import { CreditCard, Wallet, Banknote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePayments } from "@/hooks/usePayments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PaymentMethodChangerTranslations {
  title?: string;
  description?: string;
  creditCard?: string;
  creditCardDesc?: string;
  paypal?: string;
  paypalDesc?: string;
  cashToDriver?: string;
  cashToDriverDesc?: string;
  changeMethod?: string;
  changing?: string;
  successMessage?: string;
  errorMessage?: string;
  currentMethod?: string;
  cannotChange?: string;
}

const DEFAULT_TRANSLATIONS: Required<PaymentMethodChangerTranslations> = {
  title: "Change Payment Method",
  description: "Select your preferred payment method",
  creditCard: "Credit/Debit Card",
  creditCardDesc: "Pay online with Stripe",
  paypal: "PayPal",
  paypalDesc: "Pay with PayPal",
  cashToDriver: "Cash to Driver",
  cashToDriverDesc: "Pay on transfer day",
  changeMethod: "Change Method",
  changing: "Changing...",
  successMessage: "Payment method updated",
  errorMessage: "Failed to update payment method",
  currentMethod: "Current",
  cannotChange: "Cannot change payment method after payment",
};

const TURKISH_TRANSLATIONS: Required<PaymentMethodChangerTranslations> = {
  title: "Ödeme Yöntemini Değiştir",
  description: "Tercih ettiğiniz ödeme yöntemini seçin",
  creditCard: "Kredi/Banka Kartı",
  creditCardDesc: "Stripe ile online öde",
  paypal: "PayPal",
  paypalDesc: "PayPal ile öde",
  cashToDriver: "Şoföre Nakit",
  cashToDriverDesc: "Transfer gününde öde",
  changeMethod: "Yöntemi Değiştir",
  changing: "Değiştiriliyor...",
  successMessage: "Ödeme yöntemi güncellendi",
  errorMessage: "Ödeme yöntemi güncellenemedi",
  currentMethod: "Mevcut",
  cannotChange: "Ödeme yapıldıktan sonra yöntem değiştirilemez",
};

export interface PaymentMethodChangerProps {
  reservationId: string;
  currentPaymentStatus?: string | null;
  currentPaymentType?: string | null;
  onMethodChanged?: (newMethod: string) => void;
  className?: string;
  translations?: PaymentMethodChangerTranslations;
  locale?: 'en' | 'tr';
  variant?: 'default' | 'compact';
}

type PaymentMethod = 'stripe' | 'paypal' | 'cash';

const getMethodFromPaymentType = (paymentType: string | null): PaymentMethod => {
  if (paymentType === 'payment_link') return 'stripe';
  if (paymentType === 'paypal') return 'paypal';
  return 'cash';
};

const getPaymentTypeFromMethod = (method: PaymentMethod): string => {
  if (method === 'stripe' || method === 'paypal') return 'payment_link';
  return 'cash';
};

const getPaymentStatusFromMethod = (method: PaymentMethod): string => {
  if (method === 'cash') return 'pay_on_transfer';
  return 'pending';
};

export const PaymentMethodChanger = memo(({
  reservationId,
  currentPaymentStatus,
  currentPaymentType,
  onMethodChanged,
  className,
  translations,
  locale = 'en',
  variant = 'default',
}: PaymentMethodChangerProps) => {
  const defaultTranslations = locale === 'tr' ? TURKISH_TRANSLATIONS : DEFAULT_TRANSLATIONS;
  const t = { ...defaultTranslations, ...translations };

  const currentMethod = getMethodFromPaymentType(currentPaymentType || null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(currentMethod);
  const [isChanging, setIsChanging] = useState(false);

  const { isStripeEnabled, isPayPalEnabled } = usePayments();

  // Cannot change if already paid
  const canChange = currentPaymentStatus !== 'paid';
  const hasChanged = selectedMethod !== currentMethod;

  const handleChangeMethod = useCallback(async () => {
    if (!hasChanged || !canChange) return;

    setIsChanging(true);

    try {
      const newPaymentType = getPaymentTypeFromMethod(selectedMethod);
      const newPaymentStatus = getPaymentStatusFromMethod(selectedMethod);

      const { error } = await supabase
        .from('reservations')
        .update({
          payment_type: newPaymentType,
          payment_status: newPaymentStatus,
          payment_link: selectedMethod === 'cash' ? null : undefined, // Clear link if switching to cash
          payment_provider: selectedMethod === 'cash' ? null : selectedMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success(t.successMessage);
      onMethodChanged?.(newPaymentType);
    } catch (error) {
      console.error('Error changing payment method:', error);
      toast.error(t.errorMessage);
    } finally {
      setIsChanging(false);
    }
  }, [hasChanged, canChange, selectedMethod, reservationId, t.successMessage, t.errorMessage, onMethodChanged]);

  if (!canChange) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {t.cannotChange}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={variant === 'compact' ? 'pb-2' : undefined}>
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedMethod}
          onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}
          className="space-y-2"
        >
          {/* Stripe Option */}
          {isStripeEnabled && (
            <div className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
              selectedMethod === 'stripe' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
              "cursor-pointer"
            )}>
              <RadioGroupItem value="stripe" id="method-stripe" />
              <Label htmlFor="method-stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.creditCard}</p>
                    {currentMethod === 'stripe' && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {t.currentMethod}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.creditCardDesc}</p>
                </div>
              </Label>
            </div>
          )}

          {/* PayPal Option */}
          {isPayPalEnabled && (
            <div className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
              selectedMethod === 'paypal' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
              "cursor-pointer"
            )}>
              <RadioGroupItem value="paypal" id="method-paypal" />
              <Label htmlFor="method-paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                <Wallet className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.paypal}</p>
                    {currentMethod === 'paypal' && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {t.currentMethod}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.paypalDesc}</p>
                </div>
              </Label>
            </div>
          )}

          {/* Cash Option - Always available */}
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
            selectedMethod === 'cash' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
            "cursor-pointer"
          )}>
            <RadioGroupItem value="cash" id="method-cash" />
            <Label htmlFor="method-cash" className="flex items-center gap-2 cursor-pointer flex-1">
              <Banknote className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t.cashToDriver}</p>
                  {currentMethod === 'cash' && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {t.currentMethod}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t.cashToDriverDesc}</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <Button
          onClick={handleChangeMethod}
          disabled={!hasChanged || isChanging}
          className="w-full"
          size={variant === 'compact' ? 'default' : 'lg'}
        >
          {isChanging ? t.changing : t.changeMethod}
        </Button>
      </CardContent>
    </Card>
  );
});

PaymentMethodChanger.displayName = 'PaymentMethodChanger';

export { TURKISH_TRANSLATIONS as PAYMENT_METHOD_CHANGER_TR };
export default PaymentMethodChanger;
