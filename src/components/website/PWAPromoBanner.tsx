import { Smartphone, Download, Zap, Wifi, Bell, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { toast } from "sonner";
import { IOSInstallModal } from "./IOSInstallModal";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";

export function PWAPromoBanner() {
  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall } = usePWAInstall();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const navigate = useNavigate();

  // Use centralized rating from Google Reviews hook (must be before any early return)
  const { rating, totalReviews: reviewCount } = useGoogleReviewStats();

  // Don't show if already installed, in standalone mode, or dismissed
  if (isStandalone || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        toast.success(
          language === 'TR' ? 'Uygulama kuruldu!' : 'App installed!',
          {
            description: language === 'TR' 
              ? 'Artık ana ekranınızdan erişebilirsiniz' 
              : 'You can now access it from your home screen'
          }
        );
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      navigate("/install");
    }
  };

  const features = language === 'TR' 
    ? [
        { icon: Zap, text: "Hızlı erişim" },
        { icon: Wifi, text: "Çevrimdışı çalışır" },
        { icon: Bell, text: "Anlık bildirimler" },
      ]
    : [
        { icon: Zap, text: "Fast access" },
        { icon: Wifi, text: "Works offline" },
        { icon: Bell, text: "Push notifications" },
      ];

  return (
    <>
      <section className="relative py-12 md:py-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="container relative mx-auto px-4">
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="mb-6 inline-flex items-center justify-center">
              <div className={cn(
                "relative p-4 rounded-2xl",
                "bg-gradient-to-br from-primary to-primary/80",
                "shadow-xl shadow-primary/25",
                "animate-pulse"
              )}>
                <Smartphone className="h-10 w-10 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                  <Download className="h-2.5 w-2.5 text-accent-foreground" />
                </div>
              </div>
            </div>

            {/* App Store Style Rating */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-5 w-5 transition-all",
                      star <= Math.floor(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : star === Math.ceil(rating) && rating % 1 !== 0
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-foreground">{rating}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {reviewCount.toLocaleString()} {language === 'TR' ? 'değerlendirme' : 'reviews'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {language === 'TR' 
                ? 'Meet Transfer Uygulamasını Yükleyin' 
                : 'Install Meet Transfer App'}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {language === 'TR'
                ? 'Telefonunuza yükleyin, rezervasyonlarınızı kolayca takip edin ve özel tekliflerden haberdar olun.'
                : 'Install on your phone, easily track your bookings and stay updated with special offers.'}
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-foreground/80"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Install Button */}
            <Button
              onClick={handleInstall}
              size="lg"
              className={cn(
                "relative overflow-hidden",
                "bg-gradient-to-r from-primary via-primary/90 to-primary/80",
                "text-primary-foreground font-semibold text-lg",
                "shadow-xl shadow-primary/30",
                "hover:shadow-2xl hover:shadow-primary/40",
                "hover:scale-105 active:scale-100",
                "transition-all duration-300 ease-out",
                "px-8 py-6 h-auto",
                "group"
              )}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Download className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              {language === 'TR' ? 'Şimdi Yükle' : 'Install Now'}
            </Button>

            {/* Note */}
            <p className="mt-4 text-sm text-muted-foreground">
              {language === 'TR'
                ? '✨ Ücretsiz • Güvenli • Sadece 2MB'
                : '✨ Free • Secure • Only 2MB'}
            </p>
          </div>
        </div>
      </section>

      <IOSInstallModal open={showIOSModal} onOpenChange={setShowIOSModal} />
    </>
  );
}
