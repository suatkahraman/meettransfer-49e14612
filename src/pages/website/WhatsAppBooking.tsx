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
import { MessageCircle, ArrowRight } from "lucide-react";

// Airports list removed - pickup is now free text

const vehicleTypes = [
  "Mercedes Vito",
  "Mercedes Vip Vito",
  "Maybach",
  "Minibus",
];

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
    window.open(`https://wa.me/905301234567?text=${encodedMessage}`, "_blank");
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
