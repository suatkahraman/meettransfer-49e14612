import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, DollarSign, Clock4, ShieldCheck, Users } from "lucide-react";
import privateTransferWorthHero from "@/assets/blog/private-transfer-worth-hero.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";

const IsPrivateTransferWorthIt = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    {
      question: t('blogWorthItFaq1Q'),
      answer: t('blogWorthItFaq1A')
    },
    {
      question: t('blogWorthItFaq2Q'),
      answer: t('blogWorthItFaq2A')
    },
    {
      question: t('blogWorthItFaq3Q'),
      answer: t('blogWorthItFaq3A')
    },
    {
      question: t('blogWorthItFaq4Q'),
      answer: t('blogWorthItFaq4A')
    },
    {
      question: t('blogWorthItFaq5Q'),
      answer: t('blogWorthItFaq5A')
    },
    {
      question: t('blogWorthItFaq6Q'),
      answer: t('blogWorthItFaq6A')
    }
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t('blogWorthItTitle')}
        description={t('blogWorthItDesc')}
        keywords="private transfer Turkey worth it 2025, Turkey airport transfer cost, VIP transfer value, should I book private transfer, Turkey private transfer, airport taxi vs private, Turkey transfer comparison, Istanbul private transfer price, Antalya private transfer worth it"
        canonicalPath="/blog/is-private-transfer-worth-it-turkey"
        ogImage="https://meettransfer.app/og/private-transfer-worth-og.jpg"
        ogType="article"
        articlePublishedTime="2024-11-20"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Tips"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t('blogWorthItH1'),
            description: t('blogWorthItDesc'),
            image: 'https://meettransfer.app/og/private-transfer-worth-og.jpg',
            datePublished: '2024-11-20',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '16',
            wordCount: 2400,
            keywords: ['private transfer worth it', 'Turkey airport transfer', 'VIP transfer value', 'transfer comparison'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogWorthH1"), url: '/blog/is-private-transfer-worth-it-turkey' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          }
        ]}
      />

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">{t('travelTips')}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {t('blogWorthItH1')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {t('blogWorthItIntro')}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formatBlogDate("2024-11-20")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              14 {t('minRead')}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t('blogWorthItH1')} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={privateTransferWorthHero} 
            alt="Luxury private transfer interior in Turkey - VIP Mercedes with premium leather seats and amenities"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "million-dollar-question", title: "The Million-Dollar Question" },
          { id: "real-cost-breakdown", title: "The Real Cost Breakdown" },
          { id: "hidden-value", title: "The Hidden Value Proposition" },
          { id: "group-math", title: "The Group Math: Where Private Transfer Wins" },
          { id: "definitely-worth", title: "When Private Transfer is DEFINITELY Worth It" },
          { id: "might-not-worth", title: "When Private Transfer Might NOT Be Worth It" },
        ]} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="million-dollar-question">The Million-Dollar Question</h2>
          <p>
            You're planning your trip to Turkey and facing a common dilemma: should you splurge on 
            a private airport transfer, or save money with regular transportation? It's a question we hear 
            all the time, and we're going to give you an honest, no-nonsense answer.
          </p>
          <p>
            Spoiler alert: the answer isn't simply "yes" or "no." It depends on your specific 
            situation, budget, and priorities. In this comprehensive analysis, we'll break down 
            exactly when private transfer is worth every penny, and when you might be better off 
            with alternatives.
          </p>

          <h2 id="real-cost-breakdown">The Real Cost Breakdown</h2>
          <p>
            Let's start with what matters most to many travelers: the money. Here's an honest 
            comparison of costs from Istanbul Airport to Taksim:
          </p>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Comparison: Istanbul Airport to Taksim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Metro + Walking</span>
                    <span className="text-green-600 font-bold">$1-2</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Havaist Bus</span>
                    <span className="text-green-600 font-bold">$5-7</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Regular Transportation</span>
                    <span className="text-amber-600 font-bold">Variable</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="font-medium">Private Transfer (Mercedes Vito)</span>
                    <span className="text-primary font-bold">$55-65</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  *Regular transport prices vary with traffic and time of day. Private transfer is fixed.
                </p>
              </CardContent>
            </Card>
          </div>

          <p>
            Looking at these numbers, regular transport may appear to be the cheaper option. 
            But here's where it gets interesting...
          </p>

          <h2 id="hidden-value">The Hidden Value Proposition</h2>
          <p>
            When evaluating whether private transfer is "worth it," you need to consider more than 
            just the ticket price. Here's what you're actually getting:
          </p>

          <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock4 className="h-5 w-5 text-primary" />
                  Time Value
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>No waiting in queues (save 15-45 min)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Direct route, no stops</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Driver waiting when you land</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Immediate departure from airport</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Safety & Peace of Mind
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Known driver & company</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Licensed and insured service</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>No price negotiation or scams</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>24/7 customer support if issues</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="group-math">The Group Math: Where Private Transfer Wins</h2>
          <p>
            Here's where the economics flip dramatically. Let's do the math for a family of 4:
          </p>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Per-Person Cost for Family of 4
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-amber-500/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Regular Transportation (x2)</h4>
                    <p className="text-2xl font-bold mb-1">Variable total</p>
                    <p className="text-sm text-muted-foreground">Per person varies</p>
                    <ul className="text-sm mt-3 space-y-1 text-muted-foreground">
                      <li>• Split into two vehicles</li>
                      <li>• Coordinate two drivers</li>
                      <li>• Risk of getting separated</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Private Transfer (Mercedes Vito)</h4>
                    <p className="text-2xl font-bold text-primary mb-1">$55-65 total</p>
                    <p className="text-sm text-muted-foreground">$14-16 per person</p>
                    <ul className="text-sm mt-3 space-y-1 text-muted-foreground">
                      <li>• Everyone together</li>
                      <li>• Premium vehicle</li>
                      <li>• Meet & greet included</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p>
            <strong>The verdict:</strong> For 2+ travelers, private transfer often costs the same 
            or less per person than regular transportation, while offering a dramatically better experience.
          </p>

          <h2 id="definitely-worth">When Private Transfer is DEFINITELY Worth It</h2>
          <p>
            Based on our experience with thousands of transfers, here are the situations where 
            private transfer provides exceptional value:
          </p>

          <h3>1. Night Arrivals (Any Time After 10 PM)</h3>
          <p>
            Arriving late at night? Private transfer is almost always worth it because:
          </p>
          <ul>
            <li>Fewer transportation options available</li>
            <li>Safety concerns in unfamiliar city at night</li>
            <li>Public transport may not be running</li>
            <li>You're tired and want to get to bed ASAP</li>
          </ul>

          <h3>2. Traveling with Children</h3>
          <p>
            Parents traveling with kids find private transfer invaluable:
          </p>
          <ul>
            <li>Child seats available on request</li>
            <li>Space for strollers and bags</li>
            <li>No wrestling luggage through metro stations</li>
            <li>Direct door-to-door, minimizing stress</li>
            <li>Kids can nap in the comfortable vehicle</li>
          </ul>

          <h3>3. First-Time Visitors</h3>
          <p>
            Never been to Turkey? A welcoming driver with your name on a board eliminates:
          </p>
          <ul>
            <li>Confusion navigating the airport</li>
            <li>Risk of issues with unfamiliar transportation</li>
            <li>Stress of explaining your destination</li>
            <li>Uncertainty about fair pricing</li>
          </ul>

          <h3>4. Business Travelers</h3>
          <p>
            For professionals, time is money:
          </p>
          <ul>
            <li>Work on laptop with WiFi during journey</li>
            <li>Make calls in private vehicle</li>
            <li>Arrive fresh for meetings</li>
            <li>Professional image with luxury vehicle</li>
            <li>Reliable timing for tight schedules</li>
          </ul>

          <h3>5. Multiple Pieces of Luggage</h3>
          <p>
            Got more than a carry-on? Consider:
          </p>
          <ul>
            <li>Mercedes Vito handles 6+ large suitcases easily</li>
            <li>No extra charges for luggage</li>
            <li>Driver helps load and unload</li>
            <li>No wrestling bags onto buses or trains</li>
          </ul>

          <h2 id="might-not-worth">When Private Transfer Might NOT Be Worth It</h2>
          <p>
            We believe in honesty, so here's when you might skip the private transfer:
          </p>

          <div className="not-prose my-8">
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-amber-500" />
                  Consider Alternatives If...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>You're a solo budget traveler with light luggage</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Arriving during daytime with metro access to your destination</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>You're an experienced traveler comfortable with local transport</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Very short distance (under 10km) in daytime</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>You enjoy the adventure of figuring things out</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Real Traveler Testimonials</h2>
          <p>
            Don't just take our word for it. Here's what travelers say about their experience:
          </p>
          <blockquote className="border-l-4 border-primary pl-4 italic">
            "After a 12-hour flight with two kids under 5, the last thing I wanted was to struggle 
            with transport. Having our driver waiting with cold water and helping with the car seats 
            was worth every dollar." – Sarah M., UK
          </blockquote>
          <blockquote className="border-l-4 border-primary pl-4 italic">
            "I tried regular transport on my first trip to Istanbul. Had some communication issues. 
            Second trip, I booked private transfer - no stress, fixed 
            price, professional service. Never going back." – Marco D., Italy
          </blockquote>
          <blockquote className="border-l-4 border-primary pl-4 italic">
            "For our group of 6, private minivan was the obvious choice and so much 
            easier. We could all chat and plan on the way to the hotel." – Jennifer T., USA
          </blockquote>

          <h2>The Bottom Line</h2>
          <p>
            So, is private transfer worth it in Turkey? Here's our honest assessment:
          </p>
          <ul>
            <li><strong>For families and groups:</strong> Almost always worth it</li>
            <li><strong>For night arrivals:</strong> Definitely worth it</li>
            <li><strong>For first-time visitors:</strong> Highly recommended</li>
            <li><strong>For business travelers:</strong> Essential</li>
            <li><strong>For solo budget travelers:</strong> Depends on your priorities</li>
          </ul>
          <p>
            The "extra" cost of private transfer buys you time, comfort, safety, and peace of 
            mind. For many travelers, starting or ending their trip without stress is worth 
            far more than the price difference.
          </p>
          <p>
            At <Link to={getLocalizedPath("/about")} className="text-primary hover:underline">Meet Transfer</Link>, 
            we've served thousands of travelers who made the choice to prioritize their comfort. 
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline"> Request your 
            price</Link> today and experience the difference for yourself.
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Turkey" />

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">{t('blogWorthItFaqTitle')}</h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        <RelatedArticles currentArticleId="is-private-transfer-worth-it-turkey" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IsPrivateTransferWorthIt;
