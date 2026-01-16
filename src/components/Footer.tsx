import { Mail, Phone, Clock, Facebook, Instagram, Twitter, Youtube, Star, MapPin } from "lucide-react";
import { PrefetchLink } from "@/components/ui/prefetch-link";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, SUPPORT_EMAIL, COMPANY_NAME, GLOBAL_OFFICES } from "@/lib/contact";

const TripAdvisorBadge = () => (
  <a
    href="https://www.tripadvisor.com/Attraction_Review-g293974-d9884368-Reviews-Meet_Transfer-Istanbul.html"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-3 px-4 py-2 bg-primary-foreground/10 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-all group"
  >
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#00AF87]">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <path
        fill="currentColor"
        d="M12 6a3 3 0 100 6 3 3 0 000-6zm-4.5 4.5a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4zM12 14c-1.5 0-2.75 1.25-2.75 2.75h5.5c0-1.5-1.25-2.75-2.75-2.75z"
      />
    </svg>
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-primary-foreground">4.7</span>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < 4 ? "fill-[#00AF87] text-[#00AF87]" : "fill-[#00AF87]/50 text-[#00AF87]"
            }`}
          />
        ))}
      </div>
    </div>
    <span className="text-xs text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
      492 reviews
    </span>
  </a>
);

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/meettransfer", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/share/17w6b51DcX/", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/MeetTransfer", label: "X" },
  { icon: Youtube, href: "https://www.youtube.com/@meettransfer", label: "YouTube" },
];

export const Footer = () => {
  const { t, getLocalizedPath } = useLanguage();
  
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Meet Transfer</h3>
            <p className="text-primary-foreground/90 text-sm font-medium">{COMPANY_NAME}</p>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {t('footerDescription')}
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  >
                    <IconComponent className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
            {/* TripAdvisor Badge */}
            <div className="pt-3">
              <TripAdvisorBadge />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('footerQuickLinks')}</h4>
            <ul className="space-y-2 text-primary-foreground/80 text-sm">
              <li><PrefetchLink to={getLocalizedPath("/")} className="hover:text-primary-foreground transition-colors">{t('home')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/services")} className="hover:text-primary-foreground transition-colors">{t('services')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/destinations")} className="hover:text-primary-foreground transition-colors">{t('footerDestinations')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/about")} className="hover:text-primary-foreground transition-colors">{t('about')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/contact")} className="hover:text-primary-foreground transition-colors">{t('contact')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/terms")} className="hover:text-primary-foreground transition-colors">{t('footerTerms')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/privacy")} className="hover:text-primary-foreground transition-colors">{t('footerPrivacy')}</PrefetchLink></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('services')}</h4>
            <ul className="space-y-2 text-primary-foreground/80 text-sm">
              <li><PrefetchLink to={getLocalizedPath("/istanbul-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerIstanbul')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/antalya-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerAntalya')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/bodrum-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerBodrum')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/dalaman-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerDalaman')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/izmir-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerIzmir')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/cappadocia-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerCappadocia')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/dubai-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerDubai')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/cyprus-transfer")} className="hover:text-primary-foreground transition-colors">{t('footerCyprus')}</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/frankfurt-transfer")} className="hover:text-primary-foreground transition-colors">Frankfurt Transfer</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/greece-transfer")} className="hover:text-primary-foreground transition-colors">Greece Transfer</PrefetchLink></li>
              <li><PrefetchLink to={getLocalizedPath("/fleet")} className="hover:text-primary-foreground transition-colors">{t('footerFleet')}</PrefetchLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('contact')}</h4>
            <ul className="space-y-3 text-primary-foreground/80 text-sm">
              {/* Email Contact */}
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">
                  {WHATSAPP_DISPLAY} <span className="text-xs opacity-70">({t('footerOnlyWhatsApp')})</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary-foreground transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-primary-foreground font-medium">24/7 {t('footerAvailable')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>© 2001 {COMPANY_NAME}. {t('footerRights')}</p>
        </div>
      </div>
    </footer>
  );
};