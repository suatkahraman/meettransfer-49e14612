import { Users, Briefcase, Wifi, Droplets, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface VehicleCardProps {
  name: string;
  description: string;
  passengers: number;
  luggage: number;
  features?: string[];
  image: string;
}

const VehicleCard = ({
  name,
  description,
  passengers,
  luggage,
  features = [],
  image,
}: VehicleCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-accent" />
            <span>{passengers} {t("passengers")}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-accent" />
            <span>{luggage} {t("luggage")}</span>
          </div>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature}
                className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
