import { useState } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight, ChevronLeft, ChevronRight, Users, Briefcase } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { WHATSAPP_NUMBER } from "@/lib/contact";

// Vehicle images - premium collection (WebP optimized where possible)
import vitoAirportPremium from "@/assets/vehicles/vito-airport-premium.webp";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vehicles/vip-vito-starlight.webp";
import vitoAirportAnime from "@/assets/vito-airport-anime.jpg";
import vitoAirportWelcome from "@/assets/vito-airport-welcome.jpg";
import vitoCappadociaBalloon from "@/assets/vito-cappadocia-balloon.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoInteriorLeather from "@/assets/vito-interior-leather.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoPassengerOrange from "@/assets/vito-passenger-orange.jpg";
import vitoExteriorOpendoor from "@/assets/vito-exterior-opendoor.jpg";
import vitoPassengerNight from "@/assets/vito-passenger-night.jpg";
import vitoPassengerCouple from "@/assets/vito-passenger-couple.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import vitoVipStarlightRoof from "@/assets/vito-vip-starlight-roof.jpg";
import vitoVipLuxuryWhite from "@/assets/vito-vip-luxury-white.jpg";
import vitoVipCoupleStarlight from "@/assets/vito-vip-couple-starlight.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";
import maybachUltraLuxury from "@/assets/vehicles/maybach-luxury.webp";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import maybachPassengersBlue from "@/assets/maybach-passengers-blue.jpg";
import maybachInteriorPurple from "@/assets/maybach-interior-purple.jpg";
import maybachInteriorOrange from "@/assets/maybach-interior-orange.jpg";
import sprinterHotelArrival from "@/assets/vehicles/sprinter-arrival.webp";
import sprinterVipInterior from "@/assets/sprinter-vip-interior.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import sprinterExteriorVip from "@/assets/sprinter-exterior-vip.jpg";
import sprinterAirportFront from "@/assets/sprinter-airport-front.jpg";
import sprinterInteriorGrey from "@/assets/sprinter-interior-grey.jpg";
import sprinterInteriorTv from "@/assets/sprinter-interior-tv.jpg";
import sprinterInteriorRed from "@/assets/sprinter-interior-red.jpg";
import sprinterInteriorStarlight from "@/assets/sprinter-interior-starlight.jpg";
import sprinterInteriorBlue from "@/assets/sprinter-interior-blue.jpg";
import sprinterExteriorDark from "@/assets/sprinter-exterior-dark.jpg";
import sprinterInteriorNeon from "@/assets/sprinter-interior-neon.jpg";
import sprinterAirportNight from "@/assets/sprinter-airport-night.jpg";
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";

// Vehicle data with images and SEO-friendly alt texts - landscape only
const vehicleData = {
  "Mercedes Vito": {
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito premium airport transfer service" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito luxury white leather interior" },
      { src: vitoAirportAnime, alt: "Mercedes Vito private transfer at airport terminal" },
      { src: vitoAirportWelcome, alt: "Mercedes Vito airport pickup with welcome service" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP service in Cyprus" },
      { src: vitoCappadociaBalloon, alt: "Mercedes Vito transfer to Cappadocia hot air balloons" },
      { src: vitoInteriorLeather, alt: "Mercedes Vito premium leather interior detail" },
      { src: meetTransferDubai, alt: "Meet Transfer luxury service in Dubai" },
      { src: vitoExteriorBlack, alt: "Mercedes Vito black exterior professional transfer" },
      { src: vitoPassengerOrange, alt: "Mercedes Vito passengers enjoying comfortable ride" },
      { src: vitoExteriorOpendoor, alt: "Mercedes Vito with open door welcoming passengers" },
      { src: vitoPassengerNight, alt: "Mercedes Vito night transfer service with ambient lighting" },
      { src: vitoPassengerCouple, alt: "Mercedes Vito romantic transfer for couples" },
    ],
    passengers: 6,
    luggage: 6,
  },
  "Mercedes Vip Vito": {
    images: [
      { src: vipVitoStarlightLuxury, alt: "Mercedes VIP Vito starlight luxury ceiling" },
      { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple starlight roof interior" },
      { src: meetTransferDubai, alt: "Meet Transfer VIP service in Dubai UAE" },
      { src: vitoVipStarlightRoof, alt: "Mercedes VIP Vito starlight ceiling ambient lighting" },
      { src: vitoVipPassengers1, alt: "VIP passengers enjoying Mercedes Vito luxury transfer" },
      { src: vitoVipLuxuryWhite, alt: "Mercedes VIP Vito white leather luxury interior" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP chauffeur service Cyprus" },
      { src: vitoVipCoupleStarlight, alt: "Couple enjoying Mercedes VIP Vito starlight transfer" },
      { src: vitoVipPassengers2, alt: "Business travelers in Mercedes VIP Vito" },
      { src: vitoVipPassengersDay, alt: "Mercedes VIP Vito daytime luxury transfer service" },
    ],
    passengers: 5,
    luggage: 5,
  },
  "Mercedes Maybach Minivan": {
    images: [
      { src: maybachUltraLuxury, alt: "Mercedes Maybach ultra luxury interior with starlight galaxy ceiling" },
      { src: meetTransferCyprus, alt: "Meet Transfer Maybach service in Cyprus" },
      { src: maybachInterior, alt: "Mercedes Maybach starlight ceiling luxury interior" },
      { src: maybachPassengersBlue, alt: "VIP passengers in Mercedes Maybach blue ambient lighting" },
      { src: meetTransferDubai, alt: "Meet Transfer Maybach luxury service Dubai" },
      { src: maybachInteriorPurple, alt: "Mercedes Maybach purple starlight ceiling with TV entertainment" },
      { src: maybachInteriorOrange, alt: "Mercedes Maybach orange leather interior with starlight roof" },
    ],
    passengers: 4,
    luggage: 4,
  },
  "Minibus": {
    images: [
      { src: sprinterHotelArrival, alt: "Mercedes Sprinter VIP minibus at luxury hotel" },
      { src: sprinterVipInterior, alt: "Mercedes Sprinter VIP blue LED starlight interior" },
      { src: sprinterExteriorVip, alt: "Mercedes Sprinter VIP exterior luxury design" },
      { src: sprinterInteriorGrey, alt: "Mercedes Sprinter grey leather interior design" },
      { src: meetTransferDubai, alt: "Meet Transfer Sprinter minibus Dubai" },
      { src: sprinterInteriorTv, alt: "Mercedes Sprinter entertainment TV system" },
      { src: sprinterLuggage, alt: "Mercedes Sprinter large luggage capacity for groups" },
      { src: sprinterInteriorRed, alt: "Mercedes Sprinter red ambient lighting interior" },
      { src: sprinterInteriorStarlight, alt: "Mercedes Sprinter starlight ceiling luxury" },
      { src: meetTransferCyprus, alt: "Meet Transfer Sprinter minibus Cyprus" },
      { src: sprinterInteriorBlue, alt: "Mercedes Sprinter blue LED interior lighting" },
      { src: sprinterExteriorDark, alt: "Mercedes Sprinter black exterior professional service" },
      { src: sprinterAirportFront, alt: "Mercedes Sprinter airport transfer front view" },
      { src: sprinterInteriorNeon, alt: "Mercedes Sprinter neon interior party atmosphere" },
      { src: sprinterAirportNight, alt: "Mercedes Sprinter night airport transfer service" },
    ],
    passengers: 16,
    luggage: 16,
  },
};
const vehicleTypes = Object.keys(vehicleData);

const WhatsAppBooking = () => {
  const { t } = useLanguage();
const [formData, setFormData] = useState({
    pickup: "",
    destination: "",
    date: "",
    time: "",
    vehicleType: "",
    passengers: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = `Hello! I would like to book a transfer:

📍 Pick-up Point: ${formData.pickup}
📍 Destination: ${formData.destination}
📅 Date: ${formData.date}
🕐 Time: ${formData.time}
🚗 Vehicle: ${formData.vehicleType}
👥 Passengers: ${formData.passengers}

Please confirm availability and price.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
  };

  return (
    <WebsiteLayout>
      <SEOHead
        title="WhatsApp Quick Booking - Instant Airport Transfer Reservation | Meet Transfer"
        description="Book your airport transfer instantly via WhatsApp. Quick and easy booking for VIP transfers in Turkey, Dubai, and Cyprus. Get instant price quotes and confirmation."
        keywords="WhatsApp booking, quick transfer booking, instant airport transfer, WhatsApp transfer reservation, Meet Transfer WhatsApp, book transfer online"
        canonicalPath="/whatsapp-booking"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'WhatsApp Booking', url: '/whatsapp-booking' },
            ],
          },
        ]}
      />
      <PageHeader
        title="WhatsApp Quick Booking"
        subtitle="Book Your Transfer in Seconds"
      />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pick-up Point</Label>
                <Input
                  value={formData.pickup}
                  onChange={(e) =>
                    setFormData({ ...formData, pickup: e.target.value })
                  }
                  placeholder="Enter Pick-up Point"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("selectDestination")}</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  placeholder="Hotel name or address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("dateTime")}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("vehicleType")}</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(val) =>
                    setFormData({ ...formData, vehicleType: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Image Carousel */}
              {formData.vehicleType && vehicleData[formData.vehicleType as keyof typeof vehicleData] && (
                <div className="space-y-3">
                  <Carousel 
                    className="w-full"
                    plugins={[
                      Autoplay({
                        delay: 3000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    opts={{
                      loop: true,
                    }}
                  >
                    <CarouselContent>
                      {vehicleData[formData.vehicleType as keyof typeof vehicleData].images.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="overflow-hidden rounded-xl aspect-[4/3] bg-muted">
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                    <CarouselDots />
                  </Carousel>
                  
                  {/* Vehicle Info */}
                  <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{vehicleData[formData.vehicleType as keyof typeof vehicleData].passengers} Passengers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      <span>{vehicleData[formData.vehicleType as keyof typeof vehicleData].luggage} Luggage</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("passengers")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="16"
                  value={formData.passengers}
                  onChange={(e) =>
                    setFormData({ ...formData, passengers: e.target.value })
                  }
                  placeholder="Number of passengers"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg bg-[#25D366] hover:bg-[#22c55e] rounded-xl"
              >
                <MessageCircle className="h-6 w-6 mr-2" />
                {t("sendToWhatsApp")}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Your booking details will be sent to our WhatsApp. We'll confirm
          availability and price within minutes!
        </p>
      </div>
    </WebsiteLayout>
  );
};

export default WhatsAppBooking;
