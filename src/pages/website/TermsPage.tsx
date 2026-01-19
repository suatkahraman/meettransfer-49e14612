import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { User, Calendar, Check, Banknote, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTermsTranslations } from "@/hooks/useTermsTranslations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TermsPage = () => {
  const { getLocalizedPath } = useLanguage();
  const { t } = useTermsTranslations();

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoTitle")}
        description={t("seoDescription")}
        keywords={t("seoKeywords")}
        canonicalPath="/terms"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        noIndex={false}
      />
      <SchemaOrg
        schemas={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("home"), url: '/' },
              { name: t("termsAndConditions"), url: '/terms' },
            ],
          },
        ]}
      />

      <PageHeader
        title={t("termsAndConditions")}
        subtitle={t("readCarefully")}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Benefits Section */}
        <div className="not-prose mb-10 bg-gradient-to-br from-primary/5 via-accent/5 to-green-500/5 border-2 border-primary/20 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("whyMeetTransfer")}
            </h2>
            <p className="text-muted-foreground">
              {t("safeFlexibleTransparent")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Login Benefits */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {t("memberBenefits")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("manageBookings")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("saveDetails")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("exclusiveDiscounts")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("viewHistory")}</span>
                </li>
              </ul>
              <Link 
                to={getLocalizedPath("/login")}
                className="inline-flex items-center gap-2 mt-4 text-primary font-medium text-sm hover:underline"
              >
                {t("signUpNow")}
              </Link>
            </div>

            {/* Free Cancellation */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {t("flexibleCancellation")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-green-600">{t("freeCancellation24h")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("modifyAnytime")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("autoAdjustment")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t("fullRefundGuarantee")}</span>
                </li>
              </ul>
            </div>

            {/* Cash Payment */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl p-5 border-2 border-amber-400/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <Banknote className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                {t("cashPayment")}
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {t("popular")}
                </span>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">{t("payToDriver")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{t("currenciesAccepted")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{t("noUpfrontPayment")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{t("fixedPriceGuarantee")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prominent Cancellation Policy Banner */}
        <div className="not-prose mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400 m-0">
                {t("freeCancellationPolicy")}
              </h2>
              <p className="text-green-600 dark:text-green-500 text-sm m-0">
                {t("flexibleBookingPeaceOfMind")}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
              <div className="text-3xl mb-2">🆓</div>
              <p className="font-bold text-green-700 dark:text-green-400 text-lg mb-1">
                {t("free")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("upTo24Hours")}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="font-bold text-yellow-600 dark:text-yellow-400 text-lg mb-1">
                {t("fiftyPercentCharge")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("within24Hours")}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
              <div className="text-3xl mb-2">❌</div>
              <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-1">
                {t("hundredPercentCharge")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("noShowsOrWithin2Hours")}
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="prose prose-sm max-w-none">
          <h1 className="text-3xl font-bold mb-6 text-foreground">{t("termsTitle")}</h1>

          <h2>{t("bookingConfirmationTitle")}</h2>
          <p>{t("bookingConfirmationText")}</p>

          <h2>{t("paymentTermsTitle")}</h2>
          <div className="not-prose bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-5 w-5 text-amber-600" />
              <span className="font-bold text-amber-700 dark:text-amber-400">{t("cashPaymentOption")}</span>
            </div>
            <p className="text-sm text-muted-foreground m-0">{t("cashPaymentOptionText")}</p>
          </div>
          <p>{t("paymentTermsText")}</p>

          <h2>{t("cancellationPolicyTitle")}</h2>
          <p>{t("cancellationPolicyIntro")}</p>
          <ul>
            <li><strong className="text-green-600">{t("freeCancellationLabel")}</strong> {t("upTo24HoursBefore")}</li>
            <li><strong className="text-yellow-600">{t("fiftyPercentChargeLabel")}</strong> {t("forCancellationsWithin24Hours")}</li>
            <li><strong className="text-red-600">{t("hundredPercentChargeLabel")}</strong> {t("forNoShowsOrWithin2Hours")}</li>
          </ul>

          <h2>{t("waitingTimeTitle")}</h2>
          <p>{t("waitingTimeText")}</p>

          <h2>{t("flightDelaysTitle")}</h2>
          <p>{t("flightDelaysText")}</p>

          <h2>{t("luggagePassengersTitle")}</h2>
          <p>{t("luggagePassengersText")}</p>

          <h2>{t("childSeatsTitle")}</h2>
          <p>{t("childSeatsText")}</p>

          <h2>{t("privacyTitle")}</h2>
          <p>
            {t("privacyTextStart")}
            <a href={getLocalizedPath("/privacy")} className="text-primary hover:underline">
              {t("privacyPolicy")}
            </a>
            {t("privacyTextEnd")}
          </p>

          <h2>{t("liabilityTitle")}</h2>
          <p>{t("liabilityText")}</p>

          <h2>{t("changesTitle")}</h2>
          <p>{t("changesText")}</p>

          <h2>{t("contactInfo")}</h2>
          <p>
            <strong>Meet Transfer</strong><br />
            Email: info@meettransfer.app<br />
            {t("phoneWhatsApp")}: +1 (555) 805-1101
          </p>

          <p className="text-muted-foreground text-sm mt-8">{t("lastUpdated")}</p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 not-prose">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("faqTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("faqSubtitle")}</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="booking-1" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqBooking1Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqBooking1A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="booking-2" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqBooking2Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqBooking2A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-1" className="border-2 border-amber-400/50 rounded-xl px-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-amber-600" />
                  {t("faqPayment1Q")}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqPayment1A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-2" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqPayment2Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqPayment2A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="service-1" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqService1Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqService1A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="service-2" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqService2Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqService2A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="service-3" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqService3Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqService3A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="account-1" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {t("faqAccount1Q")}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqAccount1A")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="account-2" className="border border-border rounded-xl px-4 bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{t("faqAccount2Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{t("faqAccount2A")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default TermsPage;
