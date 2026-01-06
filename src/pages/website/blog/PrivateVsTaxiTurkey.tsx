import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, XCircle, Shield, Clock4, Wallet, Users } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivateVsTaxiTurkey = () => {
  const { t, getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "Is private transfer safer than taxi in Turkey?",
      answer: "Yes, private transfers are generally safer. Vehicles are regularly maintained, drivers are professionally trained and vetted, and companies are fully licensed and insured. You also know exactly who is picking you up."
    },
    {
      question: "How much more expensive is private transfer than taxi?",
      answer: "Private transfers typically cost 2-3 times more than taxi for short distances. However, when traveling with 2+ people, the per-person cost becomes comparable. For longer distances, the difference is smaller."
    },
    {
      question: "Can I get a taxi at Turkish airports 24/7?",
      answer: "Yes, taxis are available 24/7 at all major Turkish airports. However, late-night availability may be limited, and night tariffs (50% extra) apply between midnight and 6 AM."
    },
    {
      question: "Do Turkish taxi drivers speak English?",
      answer: "English proficiency varies widely. Drivers in tourist areas like Istanbul, Antalya, and Bodrum may have basic English, but communication can still be challenging. Private transfer drivers are typically fluent in English."
    },
    {
      question: "What happens if my flight is delayed?",
      answer: "With private transfer, your driver monitors your flight and adjusts accordingly - no extra charge. With a taxi, you simply take whatever is available when you arrive, but there's no pre-arranged pickup."
    },
    {
      question: "Which option is better for families with children?",
      answer: "Private transfer is strongly recommended for families. You can request child seats, have space for strollers, and the door-to-door service eliminates stress of navigating with kids and luggage."
    }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t('blogPrivateTaxiTitle')}
        description={t('blogPrivateTaxiDesc')}
        keywords="private transfer vs taxi Turkey, Turkey airport taxi, private car Turkey, Turkish taxi tips, airport transfer comparison, is private transfer worth it"
        canonicalPath="/blog/private-vs-taxi-transfer-turkey"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
        ogType="article"
        articlePublishedTime="2024-12-05"
        articleModifiedTime="2025-01-05"
        articleSection="Travel Tips"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t('blogPrivateTaxiH1'),
            description: t('blogPrivateTaxiDesc'),
            image: 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
            datePublished: '2024-12-05',
            dateModified: '2025-12-31',
            author: 'Meet Transfer',
            readingTime: '11',
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

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">{t('travelTips')}</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t('blogPrivateTaxiH1')}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t('blogPrivateTaxiIntro')}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              December 5, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              11 {t('minRead')}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src="/images/meet-transfer-vclass-interior.jpg" 
            alt="Private transfer vs taxi comparison"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction: The Age-Old Debate</h2>
          <p>
            When planning your trip to Turkey, one of the most important decisions you'll make is 
            how to get from the airport to your hotel. The two main options are taking a regular 
            taxi or booking a private transfer service. Both have their merits, but which is truly 
            better for your situation?
          </p>
          <p>
            In this comprehensive guide, we'll provide an honest, balanced comparison of both options. 
            We'll cover everything from safety and comfort to pricing and convenience, helping you 
            make an informed decision for your Turkish adventure.
          </p>

          <h2>Quick Summary: At a Glance</h2>
          
          <div className="not-prose grid md:grid-cols-2 gap-6 my-8">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Private Transfer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pre-booked, reliable</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Fixed pricing</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Meet & greet service</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>English-speaking driver</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>Higher base cost</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg">Regular Transport</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lower initial cost</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No booking needed</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>Variable pricing</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>Language barriers</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>Queue waiting</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Safety Comparison</h2>
          
          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety Factors to Consider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Private Transfer</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Background-checked, vetted drivers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Licensed and insured company</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Vehicle tracking available</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Driver details shared in advance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Regular vehicle maintenance</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Regular Transport</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Licensed options available</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Driver unknown until pickup</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Vehicle condition varies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>No easy tracking/accountability</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p>
            <strong>The Verdict on Safety:</strong> Private transfers offer significantly better safety 
            assurances. You know your driver in advance, the company is accountable, and vehicles are 
            regularly inspected. While regular transport options are generally safe, the lack of 
            pre-screening and variable conditions make private transfers the safer choice.
          </p>

          <h2>Comfort and Experience</h2>
          <p>
            After a long flight, comfort becomes a priority. Here's how the two options compare:
          </p>

          <h3>Private Transfer Comfort</h3>
          <ul>
            <li><strong>Vehicle quality:</strong> Premium Mercedes vehicles with leather seats</li>
            <li><strong>Climate control:</strong> Air conditioning adjusted to your preference</li>
            <li><strong>Luggage space:</strong> Ample room for multiple suitcases</li>
            <li><strong>Amenities:</strong> WiFi, bottled water, phone chargers</li>
            <li><strong>Cleanliness:</strong> Vehicles cleaned before each pickup</li>
            <li><strong>Personal space:</strong> Private vehicle, no sharing</li>
          </ul>

          <h3>Regular Transport Comfort</h3>
          <ul>
            <li><strong>Vehicle quality:</strong> Standard vehicles, condition varies</li>
            <li><strong>Climate control:</strong> May vary</li>
            <li><strong>Luggage space:</strong> Limited space</li>
            <li><strong>Amenities:</strong> Usually minimal</li>
            <li><strong>Cleanliness:</strong> Variable</li>
          </ul>

          <h2>Price Comparison</h2>
          
          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Cost Breakdown: Istanbul Airport to Taksim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Private Transfer</h4>
                    <p className="text-2xl font-bold text-primary mb-2">$55-65</p>
                    <p className="text-sm text-muted-foreground">Fixed price, all inclusive</p>
                    <p className="text-sm text-muted-foreground mt-2">Per person (2 travelers): ~$30</p>
                    <p className="text-sm text-muted-foreground">Per person (4 travelers): ~$15</p>
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-lg">
                    <h4 className="font-semibold mb-2">Regular</h4>
                    <p className="text-2xl font-bold mb-2">Variable</p>
                    <p className="text-sm text-muted-foreground">Depends on traffic and time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p>
            <strong>The Real Cost Analysis:</strong> While regular transport may appear cheaper, the true cost difference 
            narrows when you consider:
          </p>
          <ul>
            <li>For 2+ travelers, cost per person is nearly identical</li>
            <li>Private transfer price is fixed regardless of time</li>
            <li>Traffic delays don't affect private transfer pricing</li>
            <li>Value of time: no queue waiting with private transfer</li>
            <li>Peace of mind: priceless when traveling in unfamiliar territory</li>
          </ul>

          <h2>Convenience Factor</h2>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock4 className="h-5 w-5" />
                  Time and Convenience Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Private Transfer Experience</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. Exit arrivals → Driver waiting with name board (0 min wait)</li>
                      <li>2. Assistance with luggage → Walk to vehicle</li>
                      <li>3. Direct route to your exact address</li>
                      <li>4. Total stress: Minimal</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Regular Transport Experience</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. Navigate to transport area (5-10 min walk)</li>
                      <li>2. Wait for availability (varies)</li>
                      <li>3. Explain destination to driver</li>
                      <li>4. Total stress: Moderate to high</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Best Choice by Traveler Type</h2>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recommendations by Situation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-semibold">Families with Children</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">Choose: Private Transfer</strong> - Child seats available, 
                    door-to-door service, no stroller hassles, stress-free for parents.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">Solo Budget Travelers</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-amber-500">Choose: Regular or Metro</strong> - If you're comfortable 
                    navigating, regular transport offers lower cost. Metro is cheapest for daytime arrivals.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">Business Travelers</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">Choose: Private Transfer</strong> - Time is money, 
                    professional image, WiFi for working, no hassles.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">First-Time Visitors</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">Choose: Private Transfer</strong> - Eliminates stress, 
                    driver knows the way, avoid potential scams.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Groups (4+ people)</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">Choose: Private Transfer</strong> - Cost per person is 
                    excellent, everyone fits in one vehicle, much easier than multiple vehicles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Important Tips for Transport in Turkey</h2>
          <p>
            When using transport options in Turkey, keep these tips in mind:
          </p>
          <ul>
            <li><strong>Pre-booking:</strong> Recommended for airport transfers</li>
            <li><strong>Communication:</strong> Have your destination address ready</li>
            <li><strong>Payment:</strong> Confirm payment method before departure</li>
            <li><strong>Local currency:</strong> Keep some Turkish Lira available</li>
            <li><strong>Phone:</strong> Get a local SIM for communication</li>
          </ul>

          <h2>Our Honest Verdict</h2>
          <p>
            After analyzing all factors, here's our honest assessment:
          </p>
          <p>
            <strong>Choose Private Transfer</strong> if you:
          </p>
          <ul>
            <li>Are traveling with family or children</li>
            <li>Value comfort and convenience</li>
            <li>Are arriving late at night or early morning</li>
            <li>Have lots of luggage</li>
            <li>Want peace of mind</li>
            <li>Are a first-time visitor to Turkey</li>
            <li>Are traveling in a group of 2+</li>
          </ul>
          <p>
            <strong>Choose Regular Transport</strong> if you:
          </p>
          <ul>
            <li>Are an experienced traveler comfortable in Turkey</li>
            <li>Are traveling solo on a tight budget</li>
            <li>Have minimal luggage</li>
          </ul>

          <h2>Conclusion</h2>
          <p>
            While regular transport has its place, the overall experience, safety, and value of 
            <Link to={getLocalizedPath("/services")} className="text-primary hover:underline"> private 
            transfer services</Link> make them the recommended choice for most travelers to Turkey. 
            The price difference becomes negligible when traveling with others, and the peace of 
            mind is worth every penny.
          </p>
          <p>
            At Meet Transfer, we specialize in premium airport transfers with professional drivers, 
            luxury Mercedes vehicles, and 24/7 support. <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Request 
            your price</Link> today and experience the difference.
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            Ready to Book Your Private Transfer?
          </h3>
          <p className="text-muted-foreground mb-6">
            Experience the comfort and reliability of Meet Transfer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                Request Price
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={getLocalizedPath("/fleet")}>
              <Button size="lg" variant="outline">
                View Our Fleet
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">Frequently Asked Questions</h2>
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
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/istanbul-airport-transfer-price-guide")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Istanbul Airport Transfer Price Guide</h4>
              <p className="text-sm text-muted-foreground">Complete pricing for all destinations</p>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/is-private-transfer-worth-it-turkey")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Is Private Transfer Worth It in Turkey?</h4>
              <p className="text-sm text-muted-foreground">Deep dive into costs and benefits</p>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default PrivateVsTaxiTurkey;
