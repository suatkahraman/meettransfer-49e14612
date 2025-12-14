import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ReviewPromptBannerProps {
  reservationId: string;
  reservationCode: string;
  driverName: string;
}

export const ReviewPromptBanner = ({
  reservationId,
  reservationCode,
  driverName,
}: ReviewPromptBannerProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-accent/20 p-2 rounded-full">
            <Star className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-medium text-foreground">Rate your transfer experience</p>
            <p className="text-sm text-muted-foreground">
              Your driver {driverName} would love to hear your feedback
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/customer/review/${reservationId}`)}
          variant="accent"
          size="sm"
          className="shrink-0"
        >
          <Star className="h-4 w-4 mr-1" />
          Rate Driver
        </Button>
      </div>
    </div>
  );
};
