import { memo } from "react";
import { motion } from "framer-motion";
import { Wifi, Tv, Wine, Droplets, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleFeatures {
  wifi?: boolean;
  tv?: boolean;
  minibar?: boolean;
  waterService?: boolean;
}

interface ChatVehicleFeaturesCardProps {
  language: string;
  features: VehicleFeatures;
  vehicleType?: string;
}

const featureConfig = [
  { key: 'wifi', icon: Wifi, labelTR: 'WiFi İnternet', labelEN: 'WiFi Internet', color: 'text-blue-500' },
  { key: 'tv', icon: Tv, labelTR: 'TV Ekranı', labelEN: 'TV Screen', color: 'text-purple-500' },
  { key: 'minibar', icon: Wine, labelTR: 'Minibar', labelEN: 'Minibar', color: 'text-amber-500' },
  { key: 'waterService', icon: Droplets, labelTR: 'Su İkramı', labelEN: 'Water Service', color: 'text-cyan-500' },
];

export const ChatVehicleFeaturesCard = memo(function ChatVehicleFeaturesCard({
  language,
  features,
  vehicleType,
}: ChatVehicleFeaturesCardProps) {
  const isTurkish = language === "TR";
  
  // Vehicle names
  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito',
    'vip-mercedes': 'Mercedes Vito VIP',
    'maybach-minibus': 'Mercedes Maybach Minivan',
    'minibus': 'Mercedes Sprinter'
  };

  const enabledFeatures = featureConfig.filter(f => features[f.key as keyof VehicleFeatures]);
  const disabledFeatures = featureConfig.filter(f => !features[f.key as keyof VehicleFeatures]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-3 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg"
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          🎬 {isTurkish ? "Araç Özellikleri" : "Vehicle Features"}
          {vehicleType && (
            <span className="text-xs text-muted-foreground">
              ({vehicleNames[vehicleType] || vehicleType})
            </span>
          )}
        </h4>
      </div>

      {/* Features Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {featureConfig.map((feature, index) => {
            const isEnabled = features[feature.key as keyof VehicleFeatures];
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg transition-all",
                  isEnabled 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-muted/30 border border-transparent opacity-60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isEnabled ? "bg-green-500/20" : "bg-muted/50"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    isEnabled ? feature.color : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    isEnabled ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {isTurkish ? feature.labelTR : feature.labelEN}
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  isEnabled ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {isEnabled ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        {enabledFeatures.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 pt-3 border-t border-border/50"
          >
            <p className="text-xs text-muted-foreground">
              {isTurkish 
                ? `✨ ${enabledFeatures.length} özellik seçildi`
                : `✨ ${enabledFeatures.length} feature(s) selected`
              }
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

export default ChatVehicleFeaturesCard;
