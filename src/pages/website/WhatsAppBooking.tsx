import { useState } from "react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
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

// Vehicle images
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
import vito4 from "@/assets/vito-4.jpg";
import vito5 from "@/assets/vito-5.jpg";
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
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
import vitoVip3 from "@/assets/vito-vip-3.jpg";
import vitoVip4 from "@/assets/vito-vip-4.jpg";
import vitoVip5 from "@/assets/vito-vip-5.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import vitoVipStarlightRoof from "@/assets/vito-vip-starlight-roof.jpg";
import vitoVipLuxuryWhite from "@/assets/vito-vip-luxury-white.jpg";
import vitoVipCoupleStarlight from "@/assets/vito-vip-couple-starlight.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";
import maybach1 from "@/assets/maybach-1.jpg";
import maybach2 from "@/assets/maybach-2.jpg";
import maybach3 from "@/assets/maybach-3.jpg";
import maybach4 from "@/assets/maybach-4.jpg";
import maybach5 from "@/assets/maybach-5.jpg";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import sprinter1 from "@/assets/sprinter-1.jpg";
import sprinter2 from "@/assets/sprinter-2.jpg";
import sprinter3 from "@/assets/sprinter-3.jpg";
import sprinter4 from "@/assets/sprinter-4.jpg";
import sprinter5 from "@/assets/sprinter-5.jpg";
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

// Vehicle data with images
const vehicleData = {
  "Mercedes Vito": {
    images: [vito2, vitoAirportAnime, vito3, vitoAirportWelcome, meetTransferCyprus, vitoCappadociaBalloon, vito4, vitoFamilyInterior, vitoInteriorLeather, meetTransferDubai, vitoExteriorBlack, vito5, vitoPassengerOrange, vitoExteriorOpendoor, vitoPassengerNight, vitoPassengerCouple],
    passengers: 7,
    luggage: 7,
  },
  "Mercedes Vip Vito": {
    images: [vitoVip1, vitoVipStarlightPurple, meetTransferDubai, vitoVip2, vitoVipStarlightRoof, vitoVipPassengers1, vitoVip3, vitoVipLuxuryWhite, meetTransferCyprus, vitoVip4, vitoVipCoupleStarlight, vitoVipPassengers2, vitoVip5, vitoVipPassengersDay],
    passengers: 6,
    luggage: 6,
  },
  "Maybach": {
    images: [maybach1, meetTransferCyprus, maybach2, maybachInterior, maybach3, meetTransferDubai, maybach4, maybach5],
    passengers: 4,
    luggage: 4,
  },
  "Minibus": {
    images: [sprinter1, sprinterExteriorVip, sprinter2, sprinterInteriorGrey, meetTransferDubai, sprinter3, sprinterInteriorTv, sprinterLuggage, sprinterInteriorRed, sprinter4, sprinterInteriorStarlight, meetTransferCyprus, sprinterInteriorBlue, sprinter5, sprinterExteriorDark, sprinterAirportFront, sprinterInteriorNeon, sprinterAirportNight],
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
    window.open(`https://wa.me/15558051101?text=${encodedMessage}`, "_blank");
  };

  return (
    <WebsiteLayout>
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
                          <div className="overflow-hidden rounded-xl aspect-video">
                            <img
                              src={img}
                              alt={`${formData.vehicleType} - ${idx + 1}`}
                              className="w-full h-full object-cover object-center"
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
