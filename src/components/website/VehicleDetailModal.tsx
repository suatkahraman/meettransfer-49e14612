import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Briefcase, Snowflake, Wifi, Battery, Droplets, 
  ChevronLeft, ChevronRight, X, Check, Armchair, Luggage
} from "lucide-react";
import { VehicleTypeInfo } from "@/lib/vehicleTypes";
import { cn } from "@/lib/utils";

interface VehicleDetailModalProps {
  vehicle: VehicleTypeInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  price?: number;
  currency?: string;
  isTurkish?: boolean;
}

const featureIconMap: Record<string, React.ReactNode> = {
  'snowflake': <Snowflake className="h-4 w-4" />,
  'armchair': <Armchair className="h-4 w-4" />,
  'wifi': <Wifi className="h-4 w-4" />,
  'battery-charging': <Battery className="h-4 w-4" />,
  'droplets': <Droplets className="h-4 w-4" />,
  'luggage': <Luggage className="h-4 w-4" />,
};

export const VehicleDetailModal = ({
  vehicle,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  price,
  currency = "EUR",
  isTurkish = false,
}: VehicleDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!vehicle) return null;

  const images = vehicle.images || [];
  const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "₺";

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card">
        <DialogHeader className="sr-only">
          <DialogTitle>{vehicle.label}</DialogTitle>
        </DialogHeader>
        
        {/* Image Gallery */}
        <div className="relative aspect-[16/9] bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]?.src}
              alt={images[currentImageIndex]?.alt || vehicle.label}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Selected Badge */}
          {isSelected && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Check className="h-3 w-3" />
                {isTurkish ? "Seçildi" : "Selected"}
              </Badge>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide bg-muted/50">
            {images.slice(0, 10).map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  currentImageIndex === index 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{vehicle.label}</h2>
              <p className="text-muted-foreground mt-1">
                {isTurkish ? vehicle.descriptionTr : vehicle.description}
              </p>
            </div>
            {price && (
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {currencySymbol}{price}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isTurkish ? "Toplam fiyat" : "Total price"}
                </div>
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{vehicle.passengers}</div>
                <div className="text-xs text-muted-foreground">
                  {isTurkish ? "Yolcu" : "Passengers"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{vehicle.luggage}</div>
                <div className="text-xs text-muted-foreground">
                  {isTurkish ? "Bavul" : "Luggage"}
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="font-semibold mb-3">
              {isTurkish ? "Özellikler" : "Features"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vehicle.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                >
                  <div className="text-primary">
                    {featureIconMap[feature.icon] || <Check className="h-4 w-4" />}
                  </div>
                  <span className="text-sm">
                    {isTurkish ? feature.labelTr : feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {onSelect && (
            <Button
              onClick={() => {
                onSelect();
                onClose();
              }}
              className="w-full h-12 text-base font-semibold"
              variant={isSelected ? "outline" : "default"}
            >
              {isSelected ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  {isTurkish ? "Seçildi" : "Selected"}
                </>
              ) : (
                isTurkish ? "Bu Aracı Seç" : "Select This Vehicle"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailModal;
