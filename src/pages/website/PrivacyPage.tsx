import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { usePrivacyTranslations } from "@/hooks/usePrivacyTranslations";

const PrivacyPage = () => {
  const { t } = usePrivacyTranslations();

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoTitle")}
        description={t("seoDescription")}
        keywords={t("seoKeywords")}
        canonicalPath="/privacy"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        noIndex={false}
      />
      <SchemaOrg
        schemas={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("home"), url: '/' },
              { name: t("privacyPolicy"), url: '/privacy' },
            ],
          },
        ]}
      />

      <PageHeader
        title={t("privacyPolicy")}
        subtitle={t("subtitle")}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 prose prose-sm max-w-none">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{t("mainTitle")}</h1>

        <h2>{t("section1Title")}</h2>
        <p>{t("section1Intro")}</p>
        <ul>
          <li>{t("section1Item1")}</li>
          <li>{t("section1Item2")}</li>
          <li>{t("section1Item3")}</li>
          <li>{t("section1Item4")}</li>
          <li>{t("section1Item5")}</li>
        </ul>

        <h2>{t("section2Title")}</h2>
        <p>{t("section2Intro")}</p>
        <ul>
          <li>{t("section2Item1")}</li>
          <li>{t("section2Item2")}</li>
          <li>{t("section2Item3")}</li>
          <li>{t("section2Item4")}</li>
          <li>{t("section2Item5")}</li>
        </ul>

        <h2>{t("section3Title")}</h2>
        <p>{t("section3Intro")}</p>
        <ul>
          <li><strong>{t("section3Item1Label")}</strong> {t("section3Item1Text")}</li>
          <li><strong>{t("section3Item2Label")}</strong> {t("section3Item2Text")}</li>
          <li><strong>{t("section3Item3Label")}</strong> {t("section3Item3Text")}</li>
        </ul>

        <h2>{t("section4Title")}</h2>
        <p>{t("section4Intro")}</p>
        <ul>
          <li>{t("section4Item1")}</li>
          <li>{t("section4Item2")}</li>
          <li>{t("section4Item3")}</li>
          <li>{t("section4Item4")}</li>
        </ul>

        <h2>{t("section5Title")}</h2>
        <p>{t("section5Text")}</p>

        <h2>{t("section6Title")}</h2>
        <p>{t("section6Intro")}</p>
        <ul>
          <li><strong>{t("section6Item1Label")}</strong> {t("section6Item1Text")}</li>
          <li><strong>{t("section6Item2Label")}</strong> {t("section6Item2Text")}</li>
          <li><strong>{t("section6Item3Label")}</strong> {t("section6Item3Text")}</li>
          <li><strong>{t("section6Item4Label")}</strong> {t("section6Item4Text")}</li>
          <li><strong>{t("section6Item5Label")}</strong> {t("section6Item5Text")}</li>
        </ul>

        <h2>{t("section7Title")}</h2>
        <p>{t("section7Intro")}</p>
        <ul>
          <li><strong>{t("section7Item1Label")}</strong> {t("section7Item1Text")}</li>
          <li><strong>{t("section7Item2Label")}</strong> {t("section7Item2Text")}</li>
          <li><strong>{t("section7Item3Label")}</strong> {t("section7Item3Text")}</li>
        </ul>

        <h2>{t("section8Title")}</h2>
        <p>{t("section8Intro")}</p>
        <ul>
          <li>{t("section8Item1")}</li>
          <li>{t("section8Item2")}</li>
          <li>{t("section8Item3")}</li>
        </ul>

        <h2>{t("section9Title")}</h2>
        <p>{t("section9Text")}</p>

        <h2>{t("section10Title")}</h2>
        <p>{t("section10Text")}</p>

        <h2>{t("section11Title")}</h2>
        <p>{t("section11Text")}</p>

        <h2>{t("contactUs")}</h2>
        <p>{t("contactIntro")}</p>
        <p>
          <strong>Meet Transfer</strong><br />
          Email: info@meettransfer.app<br />
          {t("phoneWhatsApp")}: +1 (555) 805-1101
        </p>

        <p className="text-muted-foreground text-sm mt-8">{t("lastUpdated")}</p>
      </div>
    </WebsiteLayout>
  );
};

export default PrivacyPage;
