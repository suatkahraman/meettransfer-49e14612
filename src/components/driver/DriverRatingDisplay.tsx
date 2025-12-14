import { Star } from "lucide-react";

interface DriverRatingDisplayProps {
  averageRating: number | null;
  totalReviews: number | null;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export const DriverRatingDisplay = ({
  averageRating,
  totalReviews,
  size = "md",
  showCount = true,
}: DriverRatingDisplayProps) => {
  const rating = averageRating || 0;
  const reviews = totalReviews || 0;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (reviews === 0) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${textClasses[size]}`}>
        <Star className={`${sizeClasses[size]} text-muted-foreground/50`} />
        <span>No reviews yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? "fill-accent text-accent"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className={`font-medium ${textClasses[size]}`}>{rating.toFixed(1)}</span>
      {showCount && (
        <span className={`text-muted-foreground ${textClasses[size]}`}>
          ({reviews} {reviews === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
};
