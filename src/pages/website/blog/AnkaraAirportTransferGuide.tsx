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

const AnkaraAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { t } = useBlogT();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-02-03");

  const faqItems = [
    { question: t("blogAnkaraFaq1Q"), answer: t("blogAnkaraFaq1A") },
    { question: t("blogAnkaraFaq2Q"), answer: t("blogAnkaraFaq2A") },
    { question: t("blogAnkaraFaq3Q"), answer: t("blogAnkaraFaq3A") },
    { question: t("blogAnkaraFaq4Q"), answer: t("blogAnkaraFaq4A") },
    { question: t("blogAnkaraFaq5Q"), answer: t("blogAnkaraFaq5A") },
  ];

  const ankaraRoutes = [
    { to: t("blogAnkaraDestPursaklar"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestKecioren"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestUlus"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestCankaya"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestMamak"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestYenimahalle"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
    { to: t("blogAnkaraDestOstim"), sedan: "€44", vito: "€48", maybachMinivan: "€78", vipVito: "€60", sprinter: "€85" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogAnkaraTitle")}
        description={t("blogAnkaraDesc")}
        canonicalPath="/blog/ankara-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/vito-exterior-black.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: "LocalBusiness", includeRating: true },
          {
            type: "Article",
            headline: t("blogAnkaraTitle"),
            description: t("blogAnkaraDesc"),
            image: "https://meettransfer.app/images/vito-exterior-black.jpg",
            datePublished: "2025-02-03",
            dateModified: "2025-02-03",
            author: "Meet Transfer",
            readingTime: "8",
            wordCount: 1200,
            keywords: [
              "Ankara airport transfer",
              "ESB airport transfer",
              "Esenboğa airport transfer",
              "Ankara to Çankaya transfer",
              "Ankara to Keçiören transfer",
            ],
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: t("breadcrumbHome"), url: "/" },
              { name: t("breadcrumbBlog"), url: "/blog" },
              { name: t("blogAnkaraBreadcrumb"), url: "/blog/ankara-airport-transfer-guide" },
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
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t("blogAnkaraH1")}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t("blogAnkaraSubtitle")}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-5">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-02-03">{formattedDate}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>8 {t("minRead")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.8/5</span>
            </div>
          </div>
        </header>

        <OptimizedBlogImage
          src={vitoExteriorBlack}
          alt={t("blogAnkaraImageAlt")}
          className="w-full aspect-video rounded-xl mb-10"
          priority
        />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section>
            <h2>{t("blogAnkaraSectionIntroTitle")}</h2>
            <p>{t("blogAnkaraSectionIntroP1")}</p>
            <p>{t("blogAnkaraSectionIntroP2")}</p>
          </section>

          <section>
            <h2>{t("blogAnkaraSectionPricesTitle")}</h2>
            <p>{t("blogAnkaraSectionPricesDesc")}</p>
            <VehiclePriceTable caption={t("blogAnkaraTableCaption")} rows={ankaraRoutes} />
          </section>

          <section>
            <h2>{t("blogAnkaraSectionDestinationsTitle")}</h2>
            <p>{t("blogAnkaraSectionDestinationsDesc")}</p>
            <ul>
              <li><strong>{t("blogAnkaraDestCankaya")}:</strong> {t("blogAnkaraCankayaDesc")}</li>
              <li><strong>{t("blogAnkaraDestKecioren")}:</strong> {t("blogAnkaraKeciorenDesc")}</li>
              <li><strong>{t("blogAnkaraDestUlus")}:</strong> {t("blogAnkaraUlusDesc")}</li>
              <li><strong>{t("blogAnkaraDestOstim")}:</strong> {t("blogAnkaraOstimDesc")}</li>
            </ul>
          </section>

          <section>
            <h2>{t("blogAnkaraSectionHowToBookTitle")}</h2>
            <p>{t("blogAnkaraSectionHowToBookDesc")}</p>
            <ul>
              <li>{t("blogAnkaraBookingBullet1")}</li>
              <li>{t("blogAnkaraBookingBullet2")}</li>
              <li>{t("blogAnkaraBookingBullet3")}</li>
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
            <BlogCTA destination="Ankara" />
          </section>

          <section className="not-prose my-8">
            <FAQSection items={faqItems} title={t("frequentlyAskedQuestions")} />
          </section>
        </div>

        <RelatedArticles currentArticleId="ankara-airport-transfer-guide" />
      </article>
    </WebsiteLayout>
  );
};

export default AnkaraAirportTransferGuide;
