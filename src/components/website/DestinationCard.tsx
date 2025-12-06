import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface DestinationCardProps {
  name: string;
  airports?: string;
  image: string;
  link: string;
}

const DestinationCard = ({ name, airports, image, link }: DestinationCardProps) => {
  return (
    <Link to={link}>
      <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-bold mb-1">{name}</h3>
            {airports && (
              <div className="flex items-center gap-1 text-sm opacity-90">
                <MapPin className="h-3 w-3" />
                <span>{airports}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default DestinationCard;
