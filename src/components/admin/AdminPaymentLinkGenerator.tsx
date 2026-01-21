import { useState } from "react";
import { CreditCard, Send, Loader2, Link2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { isPaymentsEnabled, isStripeEnabled, isPayPalEnabled, type PaymentProvider } from "@/config/payments";
import { getCurrencySymbol } from "@/lib/currency";
import { toast } from "sonner";

interface AdminPaymentLinkGeneratorProps {
  reservationId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  pickup?: string;
  dropoff?: string;
  pickupDate?: string;
  pickupTime?: string;
  onLinkGenerated?: (link: string) => void;
  onLinkSent?: () => void;
}

export const AdminPaymentLinkGenerator = ({
  reservationId,
  amount,
  currency,
  customerEmail,
  customerName,
  pickup,
  dropoff,
  pickupDate,
  pickupTime,
  onLinkGenerated,
  onLinkSent,
}: AdminPaymentLinkGeneratorProps) => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | "manual">("manual");
  const [manualLink, setManualLink] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const paymentsEnabled = isPaymentsEnabled();
  const stripeEnabled = isStripeEnabled();
  const paypalEnabled = isPayPalEnabled();

  const generatePaymentLink = async () => {
    if (selectedProvider === "manual") {
      if (!manualLink.trim()) {
        toast.error("Please enter a payment link");
        return;
      }
      setGeneratedLink(manualLink.trim());
      onLinkGenerated?.(manualLink.trim());
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setIsGenerating(true);

    try {
      const baseUrl = window.location.origin;
      const functionName = selectedProvider === "stripe" ? "create-stripe-checkout" : "create-paypal-order";

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          reservationId,
          amount,
          currency,
          customerEmail,
          customerName,
          description: `Transfer: ${pickup} → ${dropoff}`,
          successUrl: `${baseUrl}/payment-success`,
          cancelUrl: `${baseUrl}/payment-cancel`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.code === "PAYMENTS_DISABLED") {
          toast.error("Payment system is not configured. Use manual link instead.");
          return;
        }
        throw new Error(data.error);
      }

      const link = data?.url || data?.approvalUrl;
      if (link) {
        setGeneratedLink(link);
        onLinkGenerated?.(link);
        toast.success("Payment link generated!");
      } else {
        throw new Error("No payment link returned");
      }
    } catch (error: any) {
      console.error("Error generating payment link:", error);
      toast.error(error.message || "Failed to generate payment link");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendPaymentLink = async () => {
    const linkToSend = generatedLink || manualLink;
    
    if (!linkToSend) {
      toast.error("No payment link to send");
      return;
    }

    if (!customerEmail) {
      toast.error("Customer email is required to send the link");
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-payment-link", {
        body: {
          quickBookingId: reservationId, // Using same field for compatibility
          reservationId,
          paymentLink: linkToSend,
          customerEmail,
          customerName,
          pickup,
          dropoff,
          pickupDate,
          pickupTime,
          price: amount,
          priceCurrency: currency,
        },
      });

      if (error) throw error;

      setLinkSent(true);
      onLinkSent?.();
      toast.success("Payment link sent to customer!");
    } catch (error: any) {
      console.error("Error sending payment link:", error);
      toast.error(error.message || "Failed to send payment link");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Online Ödeme Linki</h4>
      </div>

      {!paymentsEnabled && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Otomatik ödeme sistemi henüz aktif değil. Manuel link girebilirsiniz.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Label>Ödeme Yöntemi Seçin</Label>
        <RadioGroup
          value={selectedProvider}
          onValueChange={(v) => setSelectedProvider(v as PaymentProvider | "manual")}
          className="space-y-2"
        >
          {stripeEnabled && (
            <div className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
              <RadioGroupItem value="stripe" id="admin-stripe" />
              <Label htmlFor="admin-stripe" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Stripe (Kredi Kartı)
              </Label>
            </div>
          )}

          {paypalEnabled && (
            <div className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
              <RadioGroupItem value="paypal" id="admin-paypal" />
              <Label htmlFor="admin-paypal" className="flex items-center gap-2 cursor-pointer">
                <span className="text-blue-600 font-bold text-sm">PP</span>
                PayPal
              </Label>
            </div>
          )}

          <div className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
            <RadioGroupItem value="manual" id="admin-manual" />
            <Label htmlFor="admin-manual" className="flex items-center gap-2 cursor-pointer">
              <Link2 className="h-4 w-4" />
              Manuel Link (Wise, Banka, vb.)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {selectedProvider === "manual" && (
        <div className="space-y-2">
          <Label>Ödeme Linki</Label>
          <Input
            value={manualLink}
            onChange={(e) => setManualLink(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>
      )}

      {generatedLink && (
        <div className="space-y-2">
          <Label className="text-green-700">Oluşturulan Link</Label>
          <div className="flex gap-2">
            <Input value={generatedLink} readOnly className="bg-green-50 text-green-800" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(generatedLink);
                toast.success("Link kopyalandı!");
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {selectedProvider !== "manual" && !generatedLink && (
          <Button
            variant="outline"
            onClick={generatePaymentLink}
            disabled={isGenerating || !amount}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Link Oluştur ({getCurrencySymbol(currency)}{amount})
              </>
            )}
          </Button>
        )}

        {selectedProvider === "manual" && !generatedLink && manualLink && (
          <Button
            variant="outline"
            onClick={() => {
              setGeneratedLink(manualLink.trim());
              onLinkGenerated?.(manualLink.trim());
              toast.success("Link kaydedildi!");
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Linki Kaydet
          </Button>
        )}

        {(generatedLink || manualLink) && customerEmail && (
          <Button
            onClick={sendPaymentLink}
            disabled={isSending || linkSent}
            className={linkSent ? "bg-green-600 hover:bg-green-600" : ""}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : linkSent ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Gönderildi
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Müşteriye Gönder
              </>
            )}
          </Button>
        )}
      </div>

      {!customerEmail && (generatedLink || manualLink) && (
        <p className="text-xs text-muted-foreground">
          Müşteri e-posta adresi gerekli. Linki manuel olarak paylaşabilirsiniz.
        </p>
      )}
    </div>
  );
};
