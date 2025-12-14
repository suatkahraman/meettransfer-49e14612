import { Button } from "@/components/ui/button";
import { Phone, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";

const TripAdvisorBadge = () => (
  <a
    href="https://www.tripadvisor.com/Attraction_Review-g293974-d9884368-Reviews-Meet_Transfer-Istanbul.html"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all group"
  >
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#00AF87]">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <path
        fill="currentColor"
        d="M12 6a3 3 0 100 6 3 3 0 000-6zm-4.5 4.5a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4zM12 14c-1.5 0-2.75 1.25-2.75 2.75h5.5c0-1.5-1.25-2.75-2.75-2.75z"
      />
    </svg>
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-bold text-white">4.7</span>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < 4 ? "fill-[#00AF87] text-[#00AF87]" : "fill-[#00AF87]/50 text-[#00AF87]"
            }`}
          />
        ))}
      </div>
    </div>
    <span className="text-xs text-white/80 group-hover:text-white transition-colors">
      492 reviews
    </span>
  </a>
);

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
              className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
          
          {/* TripAdvisor Badge */}
          <div className="flex justify-center">
            <TripAdvisorBadge />
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
            <Button asChild size="lg" variant="accent" className="text-base px-8 h-12">
              <Link to={getLocalizedPath("/book")}>{t("bookYourTransfer")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm">
              <Phone className="mr-2 h-5 w-5" />
              {t("callNow")}
            </Button>
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
