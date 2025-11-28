import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BookingForm } from "@/components/BookingForm";
import { Destinations } from "@/components/Destinations";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <BookingForm />
        <Destinations />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;