import { memo } from "react";
import { CreditCard, CalendarCheck, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Multi-language translations for the coming soon payment banner
const paymentBannerTranslations: Record<string, {
  badge: string;
  title: string;
  subtitle: string;
  feature1: string;
  feature1Desc: string;
  feature2: string;
  feature2Desc: string;
  feature3: string;
  feature3Desc: string;
}> = {
  EN: {
    badge: "Coming Soon",
    title: "New Payment System",
    subtitle: "Easier and safer payments for your transfers",
    feature1: "Online Payment",
    feature1Desc: "Pay securely with card or PayPal",
    feature2: "Same Day Payment",
    feature2Desc: "Pay on the day of your transfer",
    feature3: "Free Cancellation",
    feature3Desc: "Cancel up to 24h before for free",
  },
  TR: {
    badge: "Yakında Hizmete Girecek",
    title: "Yeni Ödeme Sistemi",
    subtitle: "Transferleriniz için daha kolay ve güvenli ödeme",
    feature1: "Online Ödeme",
    feature1Desc: "Kart veya PayPal ile güvenle ödeyin",
    feature2: "Aynı Gün Ödeme",
    feature2Desc: "Transfer gününde ödeme yapın",
    feature3: "Ücretsiz İptal",
    feature3Desc: "24 saat öncesine kadar ücretsiz iptal",
  },
  DE: {
    badge: "Demnächst verfügbar",
    title: "Neues Zahlungssystem",
    subtitle: "Einfachere und sicherere Zahlungen für Ihre Transfers",
    feature1: "Online-Zahlung",
    feature1Desc: "Sicher mit Karte oder PayPal bezahlen",
    feature2: "Zahlung am selben Tag",
    feature2Desc: "Zahlen Sie am Tag Ihres Transfers",
    feature3: "Kostenlose Stornierung",
    feature3Desc: "Bis 24h vorher kostenlos stornieren",
  },
  FR: {
    badge: "Bientôt disponible",
    title: "Nouveau système de paiement",
    subtitle: "Des paiements plus faciles et plus sûrs pour vos transferts",
    feature1: "Paiement en ligne",
    feature1Desc: "Payez en toute sécurité par carte ou PayPal",
    feature2: "Paiement le jour même",
    feature2Desc: "Payez le jour de votre transfert",
    feature3: "Annulation gratuite",
    feature3Desc: "Annulez gratuitement jusqu'à 24h avant",
  },
  RU: {
    badge: "Скоро",
    title: "Новая платёжная система",
    subtitle: "Более простые и безопасные платежи за трансферы",
    feature1: "Онлайн-оплата",
    feature1Desc: "Безопасная оплата картой или PayPal",
    feature2: "Оплата в день поездки",
    feature2Desc: "Оплатите в день трансфера",
    feature3: "Бесплатная отмена",
    feature3Desc: "Отмена бесплатно за 24 часа",
  },
  IT: {
    badge: "Prossimamente",
    title: "Nuovo sistema di pagamento",
    subtitle: "Pagamenti più facili e sicuri per i tuoi trasferimenti",
    feature1: "Pagamento online",
    feature1Desc: "Paga in sicurezza con carta o PayPal",
    feature2: "Pagamento lo stesso giorno",
    feature2Desc: "Paga il giorno del trasferimento",
    feature3: "Cancellazione gratuita",
    feature3Desc: "Cancella gratis fino a 24h prima",
  },
  ES: {
    badge: "Próximamente",
    title: "Nuevo sistema de pago",
    subtitle: "Pagos más fáciles y seguros para tus traslados",
    feature1: "Pago en línea",
    feature1Desc: "Paga de forma segura con tarjeta o PayPal",
    feature2: "Pago el mismo día",
    feature2Desc: "Paga el día de tu traslado",
    feature3: "Cancelación gratuita",
    feature3Desc: "Cancela gratis hasta 24h antes",
  },
  AR: {
    badge: "قريباً",
    title: "نظام دفع جديد",
    subtitle: "مدفوعات أسهل وأكثر أماناً لتنقلاتك",
    feature1: "الدفع عبر الإنترنت",
    feature1Desc: "ادفع بأمان بالبطاقة أو PayPal",
    feature2: "الدفع في نفس اليوم",
    feature2Desc: "ادفع في يوم النقل الخاص بك",
    feature3: "إلغاء مجاني",
    feature3Desc: "إلغاء مجاني قبل 24 ساعة",
  },
  UK: {
    badge: "Незабаром",
    title: "Нова платіжна система",
    subtitle: "Простіші та безпечніші платежі за трансфери",
    feature1: "Онлайн-оплата",
    feature1Desc: "Безпечна оплата карткою або PayPal",
    feature2: "Оплата в день поїздки",
    feature2Desc: "Оплатіть у день трансферу",
    feature3: "Безкоштовне скасування",
    feature3Desc: "Скасуйте безкоштовно за 24 години",
  },
  JA: {
    badge: "近日公開",
    title: "新しい決済システム",
    subtitle: "送迎のためのより簡単で安全な支払い",
    feature1: "オンライン決済",
    feature1Desc: "カードまたはPayPalで安全にお支払い",
    feature2: "当日払い",
    feature2Desc: "送迎当日にお支払い",
    feature3: "無料キャンセル",
    feature3Desc: "24時間前まで無料キャンセル",
  },
  PT: {
    badge: "Em breve",
    title: "Novo sistema de pagamento",
    subtitle: "Pagamentos mais fáceis e seguros para suas transferências",
    feature1: "Pagamento online",
    feature1Desc: "Pague com segurança com cartão ou PayPal",
    feature2: "Pagamento no mesmo dia",
    feature2Desc: "Pague no dia da sua transferência",
    feature3: "Cancelamento gratuito",
    feature3Desc: "Cancele gratuitamente até 24h antes",
  },
};

interface PaymentComingSoonBannerProps {
  language: string;
  className?: string;
  compact?: boolean;
}

export const PaymentComingSoonBanner = memo(function PaymentComingSoonBanner({ 
  language, 
  className,
  compact = false 
}: PaymentComingSoonBannerProps) {
  const t = paymentBannerTranslations[language] || paymentBannerTranslations.EN;
  const isRTL = language === "AR";

  if (compact) {
    return (
      <div 
        className={cn(
          "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5",
          className
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
        
        <div className="relative px-4 py-3 flex items-center justify-between gap-3">
          {/* Badge & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{t.badge}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{t.title}</span>
          </div>
          
          {/* Features inline */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              {t.feature1}
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5 text-accent" />
              {t.feature2}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              {t.feature3}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-accent/5",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(var(--primary-rgb),0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(var(--accent-rgb),0.1),transparent_40%)]" />
      
      <div className="relative p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <CreditCard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">{t.badge}</span>
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">{t.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t.subtitle}</p>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Online Payment */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.feature1}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.feature1Desc}</p>
            </div>
          </div>
          
          {/* Same Day Payment */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.feature2}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.feature2Desc}</p>
            </div>
          </div>
          
          {/* Free Cancellation */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.feature3}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.feature3Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PaymentComingSoonBanner;
