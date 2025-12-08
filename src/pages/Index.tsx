import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Hero } from "@/components/Hero";
import { BookingForm } from "@/components/BookingForm";
import { Destinations } from "@/components/Destinations";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <WebsiteLayout>
      <Hero />
      <BookingForm />
      <Destinations />
      <Features />
    </WebsiteLayout>
  );
};

export default Index;