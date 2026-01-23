import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Star } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import RelatedArticles from "@/components/website/RelatedArticles";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { useBlogDate } from "@/hooks/useBlogDate";
import VehiclePriceTable from "@/components/website/VehiclePriceTable";
import { useBlogT } from "@/components/blog/BlogLayout";
import FAQSection from "@/components/website/FAQSection";
import DayTourPromoCard from "@/components/website/DayTourPromoCard";
import BlogCTA from "@/components/website/BlogCTA";

import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";

const AdanaAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { t } = useBlogT();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-17");

  const na = t("blogNotAvailable");

  const faqItems = [
    { question: t("blogAdanaFaq1Q"), answer: t("blogAdanaFaq1A") },
    { question: t("blogAdanaFaq2Q"), answer: t("blogAdanaFaq2A") },
    { question: t("blogAdanaFaq3Q"), answer: t("blogAdanaFaq3A") },
    { question: t("blogAdanaFaq4Q"), answer: t("blogAdanaFaq4A") },
    { question: t("blogAdanaFaq5Q"), answer: t("blogAdanaFaq5A") },
  ];

  const adanaRoutes = [
    { to: t("blogAdanaDestCityCenter"), sedan: "€40", vito: "€44", maybachMinivan: na, vipVito: "€48", sprinter: "€65" },
    { to: t("blogAdanaDestMersin"), sedan: "€75", vito: "€80", maybachMinivan: na, vipVito: "€88", sprinter: "€120" },
    { to: t("blogAdanaDestTarsus"), sedan: "€55", vito: "€60", maybachMinivan: na, vipVito: "€66", sprinter: "€90" },
    { to: t("blogAdanaDestAntakya"), sedan: "€180", vito: "€185", maybachMinivan: na, vipVito: "€199", sprinter: "€260" },
    { to: t("blogAdanaDestIskenderun"), sedan: "€140", vito: "€145", maybachMinivan: na, vipVito: "€160", sprinter: "€210" },
    { to: t("blogAdanaDestKozan"), sedan: "€85", vito: "€90", maybachMinivan: na, vipVito: "€99", sprinter: "€130" },
    { to: t("blogAdanaDestCeyhan"), sedan: "€70", vito: "€75", maybachMinivan: na, vipVito: "€82", sprinter: "€110" },
    { to: t("blogAdanaDestOsmaniye"), sedan: "€95", vito: "€100", maybachMinivan: na, vipVito: "€110", sprinter: "€145" },
    { to: t("blogAdanaDestGaziantep"), sedan: "€180", vito: "€185", maybachMinivan: na, vipVito: "€199", sprinter: "€270" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogAdanaTitle")}
        description={t("blogAdanaDesc")}
        canonicalPath="/blog/adana-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/vito-exterior-black.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: "LocalBusiness", includeRating: true },
          {
            type: "Article",
            headline: t("blogAdanaTitle"),
            description: t("blogAdanaDesc"),
            image: "https://meettransfer.app/images/vito-exterior-black.jpg",
            datePublished: "2025-01-17",
            dateModified: "2025-01-17",
            author: "Meet Transfer",
            readingTime: "10",
            wordCount: 1400,
            keywords: [
              "Adana airport transfer",
              "ADA airport transfer",
              "Adana to Mersin transfer",
              "Adana to Tarsus transfer",
              "Adana to Antakya transfer",
            ],
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: t("breadcrumbHome"), url: "/" },
              { name: t("breadcrumbBlog"), url: "/blog" },
              { name: t("blogAdanaBreadcrumb"), url: "/blog/adana-airport-transfer-guide" },
            ],
          },
          { type: "FAQPage", questions: faqItems },
        ]}
      />
      <ReadingProgressBar />

      <article className="max-w-7xl mx-auto px-4 py-8">
        <nav className="mb-6">
          <Link
            to={getLocalizedPath("/blog")}
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToBlog")}
          </Link>
        </nav>

        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t("blogAdanaH1")}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t("blogAdanaSubtitle")}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-5">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-17">{formattedDate}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>10 {t("minRead")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.7/5</span>
            </div>
          </div>
        </header>

        <OptimizedBlogImage
          src={vitoExteriorBlack}
          alt={t("blogAdanaImageAlt")}
          className="w-full aspect-video rounded-xl mb-10"
          priority
        />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section>
            <h2>{t("blogAdanaSectionIntroTitle")}</h2>
            <p>{t("blogAdanaSectionIntroP1")}</p>
            <p>{t("blogAdanaSectionIntroP2")}</p>
          </section>

          <section>
            <h2>{t("blogAdanaSectionPricesTitle")}</h2>
            <p>{t("blogAdanaSectionPricesDesc")}</p>
            <VehiclePriceTable caption={t("blogAdanaTableCaption")} rows={adanaRoutes} />
          </section>

          <section>
            <h2>{t("blogAdanaSectionDestinationsTitle")}</h2>
            <p>{t("blogAdanaSectionDestinationsDesc")}</p>
            <ul>
              <li><strong>{t("blogAdanaDestMersin")}:</strong> {t("blogAdanaMersinDesc")}</li>
              <li><strong>{t("blogAdanaDestTarsus")}:</strong> {t("blogAdanaTarsusDesc")}</li>
              <li><strong>{t("blogAdanaDestAntakya")}:</strong> {t("blogAdanaAntakyaDesc")}</li>
              <li><strong>{t("blogAdanaDestIskenderun")}:</strong> {t("blogAdanaIskenderunDesc")}</li>
            </ul>
          </section>

          <section>
            <h2>{t("blogAdanaSectionHowToBookTitle")}</h2>
            <p>{t("blogAdanaSectionHowToBookDesc")}</p>
            <ul>
              <li>{t("blogAdanaBookingBullet1")}</li>
              <li>{t("blogAdanaBookingBullet2")}</li>
              <li>{t("blogAdanaBookingBullet3")}</li>
            </ul>
          </section>

          <section className="not-prose my-8">
            <DayTourPromoCard
              title={t("blogDayTourPromoTitle")}
              description={t("blogDayTourPromoDesc")}
              ctaLabel={t("blogDayTourPromoCta")}
              whatsappMessage={t("blogDayTourPromoWhatsAppMessage")}
            />
          </section>

          <section className="not-prose my-8">
            <BlogCTA destination="Adana" />
          </section>

          <section className="not-prose my-8">
            <FAQSection items={faqItems} title={t("frequentlyAskedQuestions")} />
          </section>
        </div>

        <RelatedArticles currentArticleId="adana-airport-transfer-guide" />
      </article>
    </WebsiteLayout>
  );
};

export default AdanaAirportTransferGuide;
