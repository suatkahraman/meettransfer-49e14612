import { useState } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { trackConversion, CONVERSION_LABELS } from "@/lib/gtag";

const globalOffices = [
  {
    flag: "🇹🇷",
    country: "Türkiye",
    city: "İstanbul Headquarters",
    address: "Istanbul Airport (IST) – VIP Meet & Greet Terminal Office",
    phone: "+1 555 805 1101",
    whatsappOnly: true,
    email: "info@meettransfer.app",
  },
  {
    flag: "🇺🇸",
    country: "USA",
    city: "Los Angeles",
    address: "La Fashion District, Los Angeles, CA 854",
    phone: "+1 205 650 8400",
    whatsappOnly: false,
    email: null,
  },
  {
    flag: "🇩🇪",
    country: "Germany",
    city: "Berlin",
    address: "Street Business Center, Berlin 245",
    phone: "+1 205 650 8400",
    whatsappOnly: false,
    email: null,
  },
  {
    flag: "🇦🇪",
    country: "UAE",
    city: "Dubai",
    address: "Downtown Business Tower, Dubai 35",
    phone: "+1 205 650 8400",
    whatsappOnly: false,
    email: null,
  },
];

const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Track contact form conversion
    trackConversion(CONVERSION_LABELS.CONTACT_FORM_SUBMIT);

    toast.success(t("messageSent"));
    setFormData({ name: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoContactTitle")}
        description={t("seoContactDesc")}
        keywords="contact Meet Transfer, airport transfer booking, WhatsApp transfer booking, Turkey transfer contact, Istanbul transfer phone, VIP transfer support"
        canonicalPath="/contact"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Contact Us', url: '/contact' },
            ],
          },
        ]}
      />

      <PageHeader
        title={t("contactTitle")}
        subtitle={t("contactSubtitle")}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Main H1 */}
        <section>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground">
            {t("contactMainTitle")}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {t("servingWorldwide")}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {globalOffices.map((office) => (
              <Card key={office.city} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{office.flag}</span>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h2 className="font-bold text-lg">
                          {office.country} Office – {office.city}
                        </h2>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{office.address}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                            <a 
                              href={`tel:${office.phone.replace(/\s/g, '')}`}
                              className="text-muted-foreground hover:text-accent transition-colors"
                            >
                              {office.phone}
                            </a>
                          </div>
                          {office.whatsappOnly && (
                            <span className="text-xs text-accent ml-6 mt-0.5">
                              {t("whatsappOnly")}
                            </span>
                          )}
                        </div>
                        
                        {office.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                            <a 
                              href={`mailto:${office.email}`}
                              className="text-muted-foreground hover:text-accent transition-colors"
                            >
                              {office.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* WhatsApp CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">{t("fastestWay")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("instantResponses")}
          </p>
          <WhatsAppButton variant="large" />
        </div>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{t("sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder={t("yourName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="+90 5XX XXX XXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  placeholder={t("howCanWeHelp")}
                  rows={5}
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                className="w-full h-12 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("sending") : t("send")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </WebsiteLayout>
  );
};

export default ContactPage;