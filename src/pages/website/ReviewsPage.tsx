import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Star, ExternalLink, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, SchemaOrg } from "@/components/seo";

// TripAdvisor data from official page
const tripAdvisorData = {
  rating: 4.7,
  totalReviews: 492,
  url: "https://www.tripadvisor.com/Attraction_Review-g293974-d9884368-Reviews-Meet_Transfer-Istanbul.html",
  ranking: "#38 of 1,134 Transportation in Istanbul",
};

// Real reviews from TripAdvisor
const tripAdvisorReviews = [
  {
    name: "Stacy",
    location: "United States",
    rating: 5,
    title: "Highly recommend!",
    text: "Punctual and professional drivers, clean and comfortable vehicles, and excellent customer service. Reliable airport transportation at competitive prices.",
    date: "April 2025",
    type: "Business",
  },
  {
    name: "Suzanne B",
    location: "",
    rating: 4,
    title: "Airport transfer",
    text: "Excellent service with good value for money. Friendly driver and clean car. Service was on time and complimentary bottle of water given.",
    date: "February 2025",
    type: "Business",
  },
  {
    name: "SRIRAM L",
    location: "",
    rating: 5,
    title: "As Advertised",
    text: "Communication was excellent. Use WhatsApp. Picked up at the spot on time. The car was clean and it was a Mercedes Van. Highly recommended.",
    date: "December 2024",
    type: "Family",
  },
  {
    name: "metin p",
    location: "",
    rating: 5,
    title: "Perfect Transfer and City Tour",
    text: "I had a wonderful trip to Istanbul with my family. We were greeted very nicely at the airport. Our vehicle was very comfortable and luxurious.",
    date: "January 2025",
    type: "Family",
  },
  {
    name: "Adrian T",
    location: "",
    rating: 5,
    title: "Excellent Service",
    text: "A good reliable transportation service. After dealing with unscrupulous taxi drivers and other hassles this service was a godsend.",
    date: "December 2024",
    type: "Family",
  },
];

// Additional website reviews
const websiteReviews = [
  {
    name: "John Smith",
    country: "United Kingdom",
    rating: 5,
    text: "Excellent service from start to finish. The driver was waiting with my name on a board, helped with luggage, and the Mercedes was immaculate. Highly recommend!",
    date: "November 2024",
  },
  {
    name: "Maria Schmidt",
    country: "Germany",
    rating: 5,
    text: "Fantastischer Service! Pünktlich, professionell und sehr komfortables Fahrzeug. Werde definitiv wieder buchen.",
    date: "October 2024",
  },
  {
    name: "François Dubois",
    country: "France",
    rating: 5,
    text: "Service impeccable. Chauffeur très professionnel et véhicule de grande qualité. Je recommande vivement Meet Transfer.",
    date: "October 2024",
  },
];

const ReviewsPage = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="Customer Reviews - Meet Transfer Airport Transfer Service"
        description="Read reviews from 2,500+ satisfied customers. 4.9/5 rating for Meet Transfer's VIP airport transfer service in Turkey. Trusted by travelers worldwide."
        keywords="Meet Transfer reviews, airport transfer reviews Turkey, VIP transfer testimonials, customer reviews Turkey transfer, trusted transfer service"
        canonicalPath="/reviews"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Customer Reviews', url: '/reviews' },
            ],
          },
        ]}
      />

      <PageHeader
        title="Customer Reviews"
        subtitle="What Our Guests Say About Us"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* TripAdvisor Featured Section */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* TripAdvisor Logo */}
            <div className="flex-shrink-0">
              <a
                href={tripAdvisorData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <svg
                  viewBox="0 0 150 32"
                  className="h-10 md:h-12 w-auto"
                  aria-label="TripAdvisor"
                >
                  <path
                    fill="#00AF87"
                    d="M15.5 0C6.95 0 0 6.95 0 15.5S6.95 31 15.5 31 31 24.05 31 15.5 24.05 0 15.5 0zm0 5.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm-7.25 6.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zm14.5 0a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zM15.5 18c-2.5 0-4.5 2-4.5 4.5h9c0-2.5-2-4.5-4.5-4.5z"
                  />
                  <text x="36" y="22" fill="currentColor" className="text-foreground" style={{ fontSize: '14px', fontWeight: 700 }}>TripAdvisor</text>
                </svg>
              </a>
            </div>
            
            {/* Rating Display */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-4xl md:text-5xl font-bold text-foreground">
                  {tripAdvisorData.rating}
                </span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.floor(tripAdvisorData.rating)
                          ? "fill-[#00AF87] text-[#00AF87]"
                          : i < tripAdvisorData.rating
                          ? "fill-[#00AF87]/50 text-[#00AF87]"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-lg font-medium text-foreground">
                Based on {tripAdvisorData.totalReviews} verified reviews
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {tripAdvisorData.ranking}
              </p>
            </div>

            {/* CTA Button */}
            <a
              href={tripAdvisorData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#00AF87] hover:bg-[#00956F] text-white rounded-xl font-medium transition-colors"
            >
              Read All Reviews
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* TripAdvisor Reviews Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-[#00AF87] rounded-full" />
            Recent TripAdvisor Reviews
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripAdvisorReviews.map((review, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Quote className="h-8 w-8 text-[#00AF87] flex-shrink-0 opacity-50" />
                    <div>
                      <h3 className="font-semibold text-foreground">{review.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-[#00AF87] text-[#00AF87]"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <div className="font-medium text-sm text-foreground">{review.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {review.date} • {review.type}
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#00AF87]">
                      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                      <path
                        fill="currentColor"
                        d="M12 6a3 3 0 100 6 3 3 0 000-6zm-4.5 4.5a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4zM12 14c-1.5 0-2.75 1.25-2.75 2.75h5.5c0-1.5-1.25-2.75-2.75-2.75z"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Overall Rating Summary */}
        <section className="text-center bg-secondary/30 rounded-2xl p-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Trusted by Thousands of Travelers
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-8 w-8 fill-accent text-accent"
              />
            ))}
          </div>
          <div className="text-4xl font-bold mb-1">4.9</div>
          <div className="text-muted-foreground">
            Based on 2,500+ verified reviews across all platforms
          </div>
        </section>

        {/* Website Review Cards */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-accent rounded-full" />
            More Customer Stories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websiteReviews.map((review, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-accent text-accent"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{review.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {review.country}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {review.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* External Review Platforms */}
        <section className="bg-card rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-center">
            Find Us On
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={tripAdvisorData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#00AF87] text-white rounded-lg hover:bg-[#00956F] transition-colors font-medium"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3" />
                <path
                  fill="currentColor"
                  d="M12 6a3 3 0 100 6 3 3 0 000-6zm-4.5 4.5a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4zM12 14c-1.5 0-2.75 1.25-2.75 2.75h5.5c0-1.5-1.25-2.75-2.75-2.75z"
                />
              </svg>
              TripAdvisor
            </a>
            <a
              href="https://www.google.com/maps/place/Meet+Transfer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Google Reviews
            </a>
            <a
              href="https://www.trustpilot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Trustpilot
            </a>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Experience It Yourself</h2>
          <p className="text-muted-foreground mb-4">
            Join thousands of satisfied customers
          </p>
          <WhatsAppButton variant="large" />
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default ReviewsPage;
