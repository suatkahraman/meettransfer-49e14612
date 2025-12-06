import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
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
  {
    name: "Alessandro Rossi",
    country: "Italy",
    rating: 5,
    text: "Servizio eccellente! L'autista era puntuale e molto gentile. Il Mercedes V-Class era pulitissimo e confortevole.",
    date: "September 2024",
  },
  {
    name: "Elena Petrov",
    country: "Russia",
    rating: 5,
    text: "Отличный сервис! Водитель вовремя, машина комфортная и чистая. Обязательно воспользуюсь снова.",
    date: "September 2024",
  },
  {
    name: "James Wilson",
    country: "United States",
    rating: 5,
    text: "Best transfer service I've used in Turkey. The Meet & Greet was seamless and the ride to Bodrum was comfortable. Worth every penny!",
    date: "August 2024",
  },
];

const ReviewsPage = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="Customer Reviews"
        subtitle="What Our Guests Say About Us"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Overall Rating */}
        <section className="text-center">
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
            Based on 2,500+ reviews
          </div>
        </section>

        {/* Review Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card key={index}>
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

        {/* External Reviews */}
        <section className="bg-card rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-4 text-center">
            Find Us On
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Google Reviews
            </a>
            <a
              href="https://www.tripadvisor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              TripAdvisor
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
          <h3 className="text-xl font-bold mb-2">Experience It Yourself</h3>
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
