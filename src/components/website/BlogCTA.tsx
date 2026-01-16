import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWhatsAppUrl } from "@/lib/contact";

interface BlogCTAProps {
  destination?: string;
  className?: string;
}

const BlogCTA = ({ destination = "", className = "" }: BlogCTAProps) => {
  const { t, getLocalizedPath } = useLanguage();

  const whatsappMessage = destination 
    ? `Hello, I would like to book a transfer to ${destination}.`
    : "Hello, I would like to book a transfer.";

  return (
    <div className={`not-prose my-12 ${className}`}>
      {/* Main CTA Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20 overflow-hidden">
        <CardContent className="p-8">
          {/* Title */}
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-4">
            {t("blogCtaTitle")}
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("blogCtaDescription")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/")}>
              <Button size="lg" variant="accent" className="gap-2 w-full sm:w-auto">
                {t("blogCtaRequestPrice")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Phone className="h-4 w-4" />
                {t("whatsappBooking")}
              </Button>
            </a>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-primary/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">24/7</p>
              <p className="text-xs text-muted-foreground">{t("blogCtaFeature1")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">€0</p>
              <p className="text-xs text-muted-foreground">{t("blogCtaFeature2")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">4.7★</p>
              <p className="text-xs text-muted-foreground">{t("blogCtaFeature3")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">VIP</p>
              <p className="text-xs text-muted-foreground">{t("blogCtaFeature4")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogCTA;
