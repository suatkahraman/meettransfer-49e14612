import { motion, AnimatePresence } from "framer-motion";
import { Users, Briefcase, Check, Sparkles } from "lucide-react";
import { VEHICLE_TYPES, VehicleTypeInfo } from "@/lib/vehicleTypes";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// Feature icon mapping
const getFeatureIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'snowflake': <span className="text-blue-400">❄️</span>,
    'armchair': <span className="text-amber-600">🛋️</span>,
    'wifi': <span className="text-blue-500">📶</span>,
    'battery-charging': <span className="text-green-500">🔋</span>,
    'droplets': <span className="text-blue-400">💧</span>,
    'luggage': <span className="text-gray-600">🧳</span>,
    'stars': <span className="text-yellow-400">⭐</span>,
    'wine': <span className="text-purple-500">🍷</span>,
    'sparkles': <span className="text-pink-400">✨</span>,
    'crown': <span className="text-yellow-500">👑</span>,
    'tv': <span className="text-gray-700">📺</span>,
    'champagne': <span className="text-yellow-400">🥂</span>,
  };
  return iconMap[iconName] || <Check className="h-3 w-3 text-green-500" />;
};

interface VehicleTooltipProps {
  vehicleType: string;
  isVisible: boolean;
  position?: "top" | "bottom" | "left" | "right";
  isTurkish?: boolean;
  className?: string;
  alignRight?: boolean; // Force right alignment for right-side items
}

export const VehicleTooltip = ({ 
  vehicleType, 
  isVisible, 
  position = "top",
  isTurkish = false,
  className,
  alignRight = false
}: VehicleTooltipProps) => {
  const vehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
  
  if (!vehicle) return null;

  // Check if tooltip is outside viewport and adjust
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let xAdjust = 0;
      let yAdjust = 0;
      
      // Check right overflow
      if (rect.right > viewportWidth - 10) {
        xAdjust = viewportWidth - rect.right - 10;
      }
      
      // Check left overflow
      if (rect.left < 10) {
        xAdjust = 10 - rect.left;
      }
      
      // Check bottom overflow
      if (rect.bottom > viewportHeight - 10) {
        yAdjust = viewportHeight - rect.bottom - 10;
      }
      
      // Check top overflow
      if (rect.top < 10) {
        yAdjust = 10 - rect.top;
      }
      
      setAdjustedPosition({ x: xAdjust, y: yAdjust });
    }
  }, [isVisible]);

  // Position classes - with right alignment option
  const getPositionClasses = () => {
    if (alignRight) {
      // For right-side items, anchor from the right edge
      return {
        top: "bottom-full right-0 mb-2",
        bottom: "top-full right-0 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
      };
    }
    return {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };
  };

  const positionClasses = getPositionClasses();

  const arrowClasses = {
    top: alignRight 
      ? "bottom-0 right-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-card"
      : "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-card",
    bottom: alignRight
      ? "top-0 right-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-card"
      : "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-card",
    left: "right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-card",
    right: "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-card",
  };

  const animationVariants = {
    top: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className={cn(
            "absolute z-[100] w-56 sm:w-64 bg-card border border-border rounded-xl shadow-2xl p-3",
            positionClasses[position],
            className
          )}
          style={{
            transform: adjustedPosition.x !== 0 || adjustedPosition.y !== 0
              ? `translate(${adjustedPosition.x}px, ${adjustedPosition.y}px)`
              : undefined,
            maxWidth: 'calc(100vw - 20px)',
          }}
          initial={animationVariants[position].initial}
          animate={animationVariants[position].animate}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Arrow */}
          <div className={cn(
            "absolute w-0 h-0 border-8",
            arrowClasses[position]
          )} />

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={vehicle.images[0]?.src} 
                alt={vehicle.label}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{vehicle.label}</h4>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {vehicle.passengers}
                </span>
                <span className="flex items-center gap-0.5">
                  <Briefcase className="h-3 w-3" />
                  {vehicle.luggage}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
            {isTurkish ? vehicle.descriptionTr : vehicle.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {vehicle.features.slice(0, 4).map((feature, index) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-0.5 bg-muted/60 rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-[8px]">{getFeatureIcon(feature.icon)}</span>
                <span className="text-foreground/80 truncate max-w-[45px] sm:max-w-[50px]">
                  {isTurkish ? feature.labelTr : feature.label}
                </span>
              </motion.div>
            ))}
            {vehicle.features.length > 4 && (
              <div className="flex items-center gap-0.5 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium">
                <Sparkles className="h-2 w-2" />
                +{vehicle.features.length - 4}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VehicleTooltip;