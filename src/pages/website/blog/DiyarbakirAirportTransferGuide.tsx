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

import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";

const DiyarbakirAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { t } = useBlogT();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-22");

  const na = t("blogNotAvailable");

  const diyRoutes = [
    { to: t("blogDiyDestCityCenter"), sedan: "€56", vito: "€60", maybachMinivan: na, vipVito: "€66", sprinter: "€80" },
    { to: t("blogDiyDestErgani"), sedan: "€88", vito: "€92", maybachMinivan: na, vipVito: "€99", sprinter: "€160" },
    { to: t("blogDiyDestMardin"), sedan: "€144", vito: "€148", maybachMinivan: na, vipVito: "€164", sprinter: "€199" },
    { to: t("blogDiyDestMidyat"), sedan: "€184", vito: "€188", maybachMinivan: na, vipVito: "€199", sprinter: "€260" },
    { to: t("blogDiyDestUrfaAirport"), sedan: "€176", vito: "€180", maybachMinivan: na, vipVito: "€194", sprinter: "€220" },
    { to: t("blogDiyDestUrfaCenter"), sedan: "€194", vito: "€198", maybachMinivan: na, vipVito: "€224", sprinter: "€290" },
    { to: t("blogDiyDestGaziantep"), sedan: "€340", vito: "€344", maybachMinivan: na, vipVito: "€384", sprinter: "€480" },
    { to: t("blogDiyDestBatman"), sedan: "€158", vito: "€162", maybachMinivan: na, vipVito: "€184", sprinter: "€280" },
    { to: t("blogDiyDestSiirt"), sedan: "€184", vito: "€188", maybachMinivan: na, vipVito: "€199", sprinter: "€260" },
    { to: t("blogDiyDestMus"), sedan: "€260", vito: "€264", maybachMinivan: na, vipVito: "€294", sprinter: "€399" },
    { to: t("blogDiyDestElazig"), sedan: "€180", vito: "€184", maybachMinivan: na, vipVito: "€199", sprinter: "€288" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogDiyTitle")}
        description={t("blogDiyDesc")}
        canonicalPath="/blog/diyarbakir-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/vito-exterior-black.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: "LocalBusiness", includeRating: true },
          {
            type: "Article",
            headline: t("blogDiyTitle"),
            description: t("blogDiyDesc"),
            image: "https://meettransfer.app/images/vito-exterior-black.jpg",
            datePublished: "2025-01-22",
            dateModified: "2025-01-22",
            author: "Meet Transfer",
            readingTime: "8",
            wordCount: 1200,
            keywords: [
              "Diyarbakır airport transfer",
              "DIY airport transfer",
              "Diyarbakır to Mardin transfer",
              "Diyarbakır to Midyat transfer",
            ],
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: t("breadcrumbHome"), url: "/" },
              { name: t("breadcrumbBlog"), url: "/blog" },
              { name: t("blogDiyBreadcrumb"), url: "/blog/diyarbakir-airport-transfer-guide" },
            ],
          },
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
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t("blogDiyH1")}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t("blogDiySubtitle")}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-5">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-22">{formattedDate}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>8 {t("minRead")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.7/5</span>
            </div>
          </div>
        </header>

        <OptimizedBlogImage
          src={vitoExteriorBlack}
          alt={t("blogDiyImageAlt")}
          className="w-full aspect-video rounded-xl mb-10"
          priority
        />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section>
            <h2>{t("blogDiySectionPricesTitle")}</h2>
            <p>{t("blogDiySectionPricesDesc")}</p>
            <VehiclePriceTable caption={t("blogDiyTableCaption")} rows={diyRoutes} />
          </section>

          <section>
            <h2>{t("blogDiySectionHowToBookTitle")}</h2>
            <p>{t("blogDiySectionHowToBookDesc")}</p>
            <ul>
              <li>{t("blogDiyBookingBullet1")}</li>
              <li>{t("blogDiyBookingBullet2")}</li>
              <li>{t("blogDiyBookingBullet3")}</li>
            </ul>
          </section>
        </div>

        <RelatedArticles currentArticleId="diyarbakir-airport-transfer-guide" />
      </article>
    </WebsiteLayout>
  );
};

export default DiyarbakirAirportTransferGuide;
