import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { InstallAppButton } from "@/components/website/InstallAppButton";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

export const Hero = () => {
  const { t, getLocalizedPath } = useLanguage();
  
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="container relative z-10 px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex justify-center">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer Logo" 
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
          
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-sans">
              {t("heroSubtitle")}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm">
              <Link to={getLocalizedPath("/auth")}>{t("login")}</Link>
            </Button>
            <span className="text-white/80 font-medium text-sm uppercase tracking-wide">{t("and")}</span>
            <Button asChild size="lg" variant="accent" className="text-base px-8 h-12">
              <Link to={getLocalizedPath("/book")}>{t("requestPrice")}</Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 bg-[#25D366]/20 border-[#25D366]/50 text-white hover:bg-[#25D366] hover:text-white backdrop-blur-sm">
              <a 
                href="https://wa.me/905321748390?text=Hello%20%F0%9F%91%8B%20I%20would%20like%20to%20book%20a%20transfer." 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </a>
            </Button>
            {/* Install App Button - visible on mobile */}
            <div className="sm:hidden">
              <InstallAppButton 
                variant="outline" 
                size="lg" 
                className="text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Booking Process Section */}
          <div className="mt-10 pt-8 border-t border-white/20">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
              🔁 {t("howBookingWorks")}
            </h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">{t("bookingProcessIntro")}</p>
            
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">1️⃣ {t("step1Title")}</div>
                <p className="text-white/80 text-sm">{t("step1Desc")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">2️⃣ {t("step2Title")}</div>
                <p className="text-white/80 text-sm">{t("step2Desc")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">3️⃣ {t("step3Title")}</div>
                <p className="text-white/80 text-sm">{t("step3Desc")}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit3")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/80 text-sm font-sans">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("service247")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("professionalDrivers")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("luxuryFleet")}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" fillOpacity="1" />
        </svg>
      </div>
    </section>
  );
};
