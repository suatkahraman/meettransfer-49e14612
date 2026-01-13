import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, MessageCircle, Globe } from "lucide-react";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";
import { GLOBAL_OFFICES, SUPPORT_EMAIL, COMPANY_NAME } from "@/lib/contact";
import { motion } from "framer-motion";

const ContactPage = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Clock,
      title: t("contactSupport247"),
      description: t("contactSupport247Desc"),
    },
    {
      icon: MessageCircle,
      title: t("instantResponse"),
      description: t("instantResponseDesc"),
    },
    {
      icon: Globe,
      title: t("multiLanguage"),
      description: t("multiLanguageDesc"),
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoContactTitle")}
        description={t("seoContactDesc")}
        keywords="contact Meet Transfer, airport transfer booking, WhatsApp transfer booking, Turkey transfer contact, Istanbul transfer phone, VIP transfer support"
        canonicalPath="/contact"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
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

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section with Quick Contact */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("contactMainTitle")}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("servingWorldwide")}
          </p>

          {/* Quick Contact Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-3">{t("preferredContact")}</p>
              <WhatsAppButton variant="default" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Email</h3>
              <p className="text-sm text-muted-foreground mb-3">{t("emailDesc")}</p>
              <a 
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="text-center p-6"
            >
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </section>

        {/* Global Offices */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {COMPANY_NAME}
            </h2>
            <p className="text-muted-foreground">{t("globalOfficesDesc")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {GLOBAL_OFFICES.map((office, index) => {
              const isHeadquarters = index === 0;
              return (
                <motion.div
                  key={office.city}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={isHeadquarters ? "md:col-span-2" : ""}
                >
                  <Card className={`overflow-hidden h-full transition-shadow duration-300 ${
                    isHeadquarters 
                      ? "border-2 border-accent shadow-lg hover:shadow-xl bg-gradient-to-br from-accent/5 to-transparent" 
                      : "border-border/50 hover:shadow-lg"
                  }`}>
                    <CardContent className="p-6">
                      {isHeadquarters && (
                        <div className="mb-4 inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                          <MapPin className="h-4 w-4" />
                          {t("headquarters")}
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`text-4xl rounded-xl p-3 flex-shrink-0 ${
                          isHeadquarters ? "bg-accent/20" : "bg-secondary/50"
                        }`}>
                          {office.flag}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className={`font-bold text-foreground ${isHeadquarters ? "text-xl" : "text-lg"}`}>
                              {office.country}
                            </h3>
                            <p className="text-sm text-accent font-medium">{office.city}</p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {office.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className={isHeadquarters ? "text-foreground font-medium" : "text-muted-foreground"}>
                                  {office.address}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a 
                                  href={`tel:${office.phone.replace(/\s/g, '')}`}
                                  className="text-foreground hover:text-accent transition-colors font-medium"
                                >
                                  {office.phone}
                                </a>
                              </div>
                              {office.whatsappOnly && (
                                <span className="text-xs text-green-500 ml-6 mt-0.5 flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {t("whatsappOnly")}
                                </span>
                              )}
                            </div>
                            
                            {office.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a 
                                  href={`mailto:${office.email}`}
                                  className="text-foreground hover:text-accent transition-colors"
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
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* WhatsApp CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-500/10 via-green-600/5 to-green-500/10 border border-green-500/20 rounded-3xl p-8 md:p-12 text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">{t("fastestWay")}</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {t("instantResponses")}
          </p>
          <WhatsAppButton variant="large" />
        </motion.div>

        {/* PWA Install Banner */}
        <PWAPromoBanner />
      </div>
    </WebsiteLayout>
  );
};

export default ContactPage;