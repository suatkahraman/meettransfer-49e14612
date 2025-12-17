import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Check, Award, Users, MapPin, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";

const cities = [
  "Istanbul", "Antalya", "Bodrum", "Dalaman", "Izmir",
  "Cappadocia", "Fethiye", "Marmaris"
];

const AboutPage = () => {
  const { t } = useLanguage();

  const stats = [
    { value: "10+", label: t("yearsExperience") },
    { value: "50,000+", label: t("transfersCompleted") },
    { value: "8", label: t("citiesCovered") },
    { value: "24/7", label: t("availability") },
  ];

  const values = [
    {
      icon: Shield,
      title: t("safetyFirst"),
      description: t("safetyFirstDesc"),
    },
    {
      icon: Award,
      title: t("qualityService"),
      description: t("qualityServiceDesc"),
    },
    {
      icon: Clock,
      title: t("punctuality"),
      description: t("punctualityDesc"),
    },
    {
      icon: Users,
      title: t("customerFocus"),
      description: t("customerFocusDesc"),
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoAboutTitle")}
        description={t("seoAboutDesc")}
        keywords="about Meet Transfer, Turkey airport transfer company, VIP transfer service Turkey, professional chauffeur Turkey, luxury transfer company, airport transfer experience"
        canonicalPath="/about"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'About Us', url: '/about' },
            ],
          },
        ]}
      />

      <PageHeader
        title={t("aboutTitle")}
        subtitle={t("aboutSubtitle")}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Intro */}
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("whoWeAre")}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {t("aboutIntro1")}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t("aboutIntro2")}
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{t("whyChooseMeetTransfer")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section className="bg-card rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">{t("citiesWeServe")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cities.map((city) => (
              <div
                key={city}
                className="flex items-center gap-2 bg-secondary p-3 rounded-lg"
              >
                <MapPin className="h-4 w-4 text-accent" />
                <span className="font-medium">{city}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Meet & Greet */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">{t("meetGreetService")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("meetGreetDesc")}
          </p>
        </section>

        {/* Leadership */}
        <section className="bg-secondary rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <blockquote className="text-lg italic mb-4">
              "{t("ourMission")}"
            </blockquote>
            <div className="font-bold">Suat Kahraman</div>
            <div className="text-sm text-muted-foreground">{t("generalManager")}</div>
          </div>
        </section>

        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">{t("readyToExperience")}</h3>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to learn more about Meet Transfer services."
          />
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default AboutPage;