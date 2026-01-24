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

// All 11 language translations
const TRANSLATIONS: Record<string, Required<PaymentMethodChangerTranslations>> = {
  en: {
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
  },
  tr: {
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
  },
  de: {
    title: "Zahlungsmethode ändern",
    description: "Wählen Sie Ihre bevorzugte Zahlungsmethode",
    creditCard: "Kredit-/Debitkarte",
    creditCardDesc: "Online mit Stripe bezahlen",
    paypal: "PayPal",
    paypalDesc: "Mit PayPal bezahlen",
    cashToDriver: "Bar an Fahrer",
    cashToDriverDesc: "Am Transfertag bezahlen",
    changeMethod: "Methode ändern",
    changing: "Wird geändert...",
    successMessage: "Zahlungsmethode aktualisiert",
    errorMessage: "Zahlungsmethode konnte nicht aktualisiert werden",
    currentMethod: "Aktuell",
    cannotChange: "Zahlungsmethode nach Zahlung nicht änderbar",
  },
  fr: {
    title: "Changer le mode de paiement",
    description: "Sélectionnez votre mode de paiement préféré",
    creditCard: "Carte de crédit/débit",
    creditCardDesc: "Payez en ligne avec Stripe",
    paypal: "PayPal",
    paypalDesc: "Payer avec PayPal",
    cashToDriver: "Espèces au chauffeur",
    cashToDriverDesc: "Payez le jour du transfert",
    changeMethod: "Changer le mode",
    changing: "Changement...",
    successMessage: "Mode de paiement mis à jour",
    errorMessage: "Échec de la mise à jour du mode de paiement",
    currentMethod: "Actuel",
    cannotChange: "Impossible de changer le mode de paiement après paiement",
  },
  ru: {
    title: "Изменить способ оплаты",
    description: "Выберите предпочтительный способ оплаты",
    creditCard: "Кредитная/дебетовая карта",
    creditCardDesc: "Оплатить онлайн через Stripe",
    paypal: "PayPal",
    paypalDesc: "Оплатить через PayPal",
    cashToDriver: "Наличные водителю",
    cashToDriverDesc: "Оплата в день трансфера",
    changeMethod: "Изменить способ",
    changing: "Изменение...",
    successMessage: "Способ оплаты обновлён",
    errorMessage: "Не удалось обновить способ оплаты",
    currentMethod: "Текущий",
    cannotChange: "Нельзя изменить способ оплаты после оплаты",
  },
  it: {
    title: "Cambia metodo di pagamento",
    description: "Seleziona il tuo metodo di pagamento preferito",
    creditCard: "Carta di credito/debito",
    creditCardDesc: "Paga online con Stripe",
    paypal: "PayPal",
    paypalDesc: "Paga con PayPal",
    cashToDriver: "Contanti all'autista",
    cashToDriverDesc: "Paga il giorno del trasferimento",
    changeMethod: "Cambia metodo",
    changing: "Modifica in corso...",
    successMessage: "Metodo di pagamento aggiornato",
    errorMessage: "Aggiornamento metodo di pagamento fallito",
    currentMethod: "Attuale",
    cannotChange: "Non puoi cambiare il metodo dopo il pagamento",
  },
  es: {
    title: "Cambiar método de pago",
    description: "Seleccione su método de pago preferido",
    creditCard: "Tarjeta de crédito/débito",
    creditCardDesc: "Pagar en línea con Stripe",
    paypal: "PayPal",
    paypalDesc: "Pagar con PayPal",
    cashToDriver: "Efectivo al conductor",
    cashToDriverDesc: "Pagar el día del traslado",
    changeMethod: "Cambiar método",
    changing: "Cambiando...",
    successMessage: "Método de pago actualizado",
    errorMessage: "Error al actualizar el método de pago",
    currentMethod: "Actual",
    cannotChange: "No se puede cambiar el método después del pago",
  },
  ar: {
    title: "تغيير طريقة الدفع",
    description: "اختر طريقة الدفع المفضلة لديك",
    creditCard: "بطاقة ائتمان/خصم",
    creditCardDesc: "ادفع عبر الإنترنت باستخدام Stripe",
    paypal: "باي بال",
    paypalDesc: "ادفع باستخدام PayPal",
    cashToDriver: "نقداً للسائق",
    cashToDriverDesc: "ادفع يوم النقل",
    changeMethod: "تغيير الطريقة",
    changing: "جاري التغيير...",
    successMessage: "تم تحديث طريقة الدفع",
    errorMessage: "فشل تحديث طريقة الدفع",
    currentMethod: "الحالي",
    cannotChange: "لا يمكن تغيير طريقة الدفع بعد الدفع",
  },
  uk: {
    title: "Змінити спосіб оплати",
    description: "Виберіть бажаний спосіб оплати",
    creditCard: "Кредитна/дебетова картка",
    creditCardDesc: "Оплатити онлайн через Stripe",
    paypal: "PayPal",
    paypalDesc: "Оплатити через PayPal",
    cashToDriver: "Готівка водію",
    cashToDriverDesc: "Оплата в день трансферу",
    changeMethod: "Змінити спосіб",
    changing: "Зміна...",
    successMessage: "Спосіб оплати оновлено",
    errorMessage: "Не вдалося оновити спосіб оплати",
    currentMethod: "Поточний",
    cannotChange: "Не можна змінити спосіб оплати після оплати",
  },
  ja: {
    title: "支払い方法を変更",
    description: "ご希望の支払い方法を選択してください",
    creditCard: "クレジット/デビットカード",
    creditCardDesc: "Stripeでオンライン決済",
    paypal: "PayPal",
    paypalDesc: "PayPalで支払う",
    cashToDriver: "ドライバーに現金",
    cashToDriverDesc: "送迎当日に支払い",
    changeMethod: "方法を変更",
    changing: "変更中...",
    successMessage: "支払い方法を更新しました",
    errorMessage: "支払い方法の更新に失敗しました",
    currentMethod: "現在",
    cannotChange: "支払い後は変更できません",
  },
  pt: {
    title: "Alterar método de pagamento",
    description: "Selecione o seu método de pagamento preferido",
    creditCard: "Cartão de crédito/débito",
    creditCardDesc: "Pagar online com Stripe",
    paypal: "PayPal",
    paypalDesc: "Pagar com PayPal",
    cashToDriver: "Dinheiro ao motorista",
    cashToDriverDesc: "Pagar no dia do transfer",
    changeMethod: "Alterar método",
    changing: "Alterando...",
    successMessage: "Método de pagamento atualizado",
    errorMessage: "Falha ao atualizar método de pagamento",
    currentMethod: "Atual",
    cannotChange: "Não é possível alterar após o pagamento",
  },
};

// Keep backwards compatibility
const DEFAULT_TRANSLATIONS = TRANSLATIONS.en;
const TURKISH_TRANSLATIONS = TRANSLATIONS.tr;

export interface PaymentMethodChangerProps {
  reservationId: string;
  currentPaymentStatus?: string | null;
  currentPaymentType?: string | null;
  onMethodChanged?: (newMethod: string, oldMethod: string) => void;
  className?: string;
  translations?: PaymentMethodChangerTranslations;
  locale?: string;
  variant?: 'default' | 'compact';
}

type PaymentMethod = 'stripe' | 'paypal' | 'cash';

const getMethodFromPaymentType = (paymentType: string | null): PaymentMethod => {
  // Handle all online payment type variations
  if (paymentType === 'payment_link' || paymentType === 'online' || paymentType === 'stripe') return 'stripe';
  if (paymentType === 'paypal') return 'paypal';
  return 'cash';
};

const getPaymentTypeFromMethod = (method: PaymentMethod): string => {
  if (method === 'stripe') return 'online';
  if (method === 'paypal') return 'paypal';
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
  // Get translations for locale (fallback to English)
  const langKey = locale.toLowerCase().substring(0, 2);
  const defaultTranslations = TRANSLATIONS[langKey] || TRANSLATIONS.en;
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
      const oldMethod = currentMethod;

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
      onMethodChanged?.(selectedMethod, oldMethod);
    } catch (error) {
      console.error('Error changing payment method:', error);
      toast.error(t.errorMessage);
    } finally {
      setIsChanging(false);
    }
  }, [hasChanged, canChange, selectedMethod, currentMethod, reservationId, t.successMessage, t.errorMessage, onMethodChanged]);

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

// Export translations for external use
export { TRANSLATIONS as PAYMENT_METHOD_TRANSLATIONS };
export { TURKISH_TRANSLATIONS as PAYMENT_METHOD_CHANGER_TR };
export default PaymentMethodChanger;
