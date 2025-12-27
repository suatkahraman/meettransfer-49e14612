import { useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, User, Plane, Car, CreditCard, CheckCircle, Play, AlertCircle, Loader2, Ban, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { checkCompletionEligibility } from '@/hooks/useCompletionValidation';
import { toast } from 'sonner';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  driver_confirmed: boolean | null;
  // Place details
  pickup_place_name?: string | null;
  dropoff_place_name?: string | null;
}

interface SwipeableJobCardProps {
  reservation: Reservation;
  adminNotes?: string | null;
  onAccept?: () => Promise<void>;
  onComplete?: () => Promise<void>;
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  sent_to_driver: { 
    label: 'Yeni İş', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    icon: <AlertCircle className="h-4 w-4" />
  },
  assigned: { 
    label: 'Atandı', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    icon: <AlertCircle className="h-4 w-4" />
  },
  active: { 
    label: 'Devam Ediyor', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    icon: <Loader2 className="h-4 w-4" />
  },
  completed: { 
    label: 'Tamamlandı', 
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    icon: <CheckCircle className="h-4 w-4" />
  },
};


const paymentTypeLabels: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  online: 'Online',
  none: 'Yok',
  agency_pay: 'Acenta Öder',
  payment_link: 'Online Ödeme',
};

const SWIPE_THRESHOLD = 100;

export const SwipeableJobCard = ({ reservation, adminNotes, onAccept, onComplete, onClick }: SwipeableJobCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [flightDelay, setFlightDelay] = useState<number | null>(null);
  const [flightStatusValue, setFlightStatusValue] = useState<string | null>(null);
  const x = useMotionValue(0);
  
  const config = statusConfig[reservation.status] || statusConfig.sent_to_driver;
  
  // Validate completion eligibility for active jobs
  const completionValidation = useMemo(() => {
    if (reservation.status === 'active') {
      return checkCompletionEligibility(reservation);
    }
    return { canComplete: false, reason: null, isCompleted: false };
  }, [reservation.pickup_date, reservation.pickup_time, reservation.status]);
  
  // Transform for background reveal
  const rightBgOpacity = useTransform(x, [-150, -50], [1, 0]);
  const leftBgOpacity = useTransform(x, [50, 150], [0, 1]);
  const rightIconScale = useTransform(x, [-150, -80], [1.2, 0.8]);
  const leftIconScale = useTransform(x, [80, 150], [0.8, 1.2]);

  const formatPriceLocal = (price: number | null, currency: string | null) => {
    if (price === null || price === undefined) return 'Belirtilmedi';
    return `${getCurrencySymbol(currency)}${price.toLocaleString('tr-TR')}`;
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (offset < -SWIPE_THRESHOLD && reservation.status === 'active' && onComplete) {
      // Validate before completing
      if (!completionValidation.canComplete) {
        if (completionValidation.isCompleted) {
          toast.error('Bu transfer zaten tamamlanmış');
        } else {
          toast.error(completionValidation.reason || 'Bu transfer şu anda tamamlanamaz');
        }
        return;
      }
      setIsProcessing(true);
      await onComplete();
      setIsProcessing(false);
    } else if (offset > SWIPE_THRESHOLD && (reservation.status === 'sent_to_driver' || reservation.status === 'assigned') && onAccept) {
      setIsProcessing(true);
      await onAccept();
      setIsProcessing(false);
    }
  };

  const canSwipeRight = (reservation.status === 'sent_to_driver' || reservation.status === 'assigned') && onAccept;
  // Only allow swipe left if validation passes
  const canSwipeLeft = reservation.status === 'active' && onComplete && completionValidation.canComplete;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left background (Accept) */}
      {canSwipeRight && (
        <motion.div 
          className="absolute inset-y-0 left-0 w-full bg-green-500 flex items-center justify-start pl-6 rounded-xl"
          style={{ opacity: leftBgOpacity }}
        >
          <motion.div 
            className="flex items-center gap-2 text-white font-semibold"
            style={{ scale: leftIconScale }}
          >
            <Play className="h-6 w-6" />
            <span>Kabul Et</span>
          </motion.div>
        </motion.div>
      )}
      
      {/* Right background (Complete) */}
      {canSwipeLeft && (
        <motion.div 
          className="absolute inset-y-0 right-0 w-full bg-primary flex items-center justify-end pr-6 rounded-xl"
          style={{ opacity: rightBgOpacity }}
        >
          <motion.div 
            className="flex items-center gap-2 text-primary-foreground font-semibold"
            style={{ scale: rightIconScale }}
          >
            <span>Tamamla</span>
            <CheckCircle className="h-6 w-6" />
          </motion.div>
        </motion.div>
      )}

      {/* Main Card */}
      <motion.div
        drag={canSwipeRight || canSwipeLeft ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        className="relative z-10"
      >
        <Card 
          className={cn(
            "cursor-pointer active:shadow-lg transition-shadow border-l-4",
            config.bgColor.replace('bg-', 'border-'),
            isProcessing && "opacity-50 pointer-events-none"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4 space-y-3">
            {/* Header: Date, Time & Status */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(reservation.pickup_date), 'EEE, d MMM', { locale: tr })}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{reservation.pickup_time}</span>
                </div>
              </div>
              <Badge className={cn(
                "flex items-center gap-1 px-3 py-1",
                (reservation.status === 'sent_to_driver' || reservation.status === 'assigned') && "bg-orange-500/20 text-orange-700 border-orange-500",
                reservation.status === 'active' && "bg-blue-500/20 text-blue-700 border-blue-500",
                reservation.status === 'completed' && "bg-green-500/20 text-green-700 border-green-500"
              )}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{reservation.customer_name}</span>
              <span className="text-muted-foreground text-sm ml-auto">{reservation.customer_phone}</span>
            </div>

            {/* Route */}
            <div className="space-y-2">
              <LocationDisplay
                placeName={reservation.pickup_place_name}
                address={reservation.pickup}
                type="pickup"
                size="sm"
              />
              <LocationDisplay
                placeName={reservation.dropoff_place_name}
                address={reservation.dropoff}
                type="dropoff"
                size="sm"
              />
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2">
              {reservation.flight_number && (
                <>
                  <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                    <Plane className="h-3 w-3" />
                    <span>{reservation.flight_number}</span>
                  </div>
                  {/* Flight delay badge */}
                  {flightDelay && flightDelay > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      <span>+{flightDelay} dk rötar</span>
                    </div>
                  )}
                  {flightStatusValue === 'cancelled' && (
                    <div className="flex items-center gap-1 bg-destructive/20 border border-destructive/50 px-2 py-1 rounded text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span>İptal</span>
                    </div>
                  )}
                  {/* Hidden FlightStatus for fetching data */}
                  <FlightStatus
                    flightNumber={reservation.flight_number}
                    date={reservation.pickup_date}
                    compact
                    refreshIntervalMs={0}
                    className="hidden"
                    onStatusChange={(status) => {
                      const d = status.arrival?.delay || status.departure?.delay || 0;
                      setFlightDelay(d);
                      setFlightStatusValue(status.status?.toLowerCase() || null);
                    }}
                  />
                </>
              )}
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                <Car className="h-3 w-3" />
                <span>{reservation.vehicle_type}</span>
              </div>
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                <CreditCard className="h-3 w-3" />
                <span>{paymentTypeLabels[reservation.payment_type] || reservation.payment_type}</span>
              </div>
            </div>

            {/* Passenger Cash Amount */}
            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">💵 Yolcudan Alınacak Nakit</span>
                  <span className="font-bold text-lg text-amber-700 dark:text-amber-400">
                    {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {adminNotes && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">Admin Notları</span>
                    <span className="text-xs text-blue-600 dark:text-blue-300 line-clamp-2">{adminNotes}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Price & Swipe hints */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                {canSwipeRight && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Kabul etmek için sağa kaydır
                  </span>
                )}
                {reservation.status === 'active' && onComplete && !completionValidation.canComplete && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3" />
                    Transfer saati bekleniyor
                  </span>
                )}
                {canSwipeLeft && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    Tamamlamak için sola kaydır
                    <CheckCircle className="h-3 w-3" />
                  </span>
                )}
                {!canSwipeRight && !canSwipeLeft && reservation.status !== 'active' && <span />}
                <span className="font-bold text-lg text-primary">
                  {formatPriceLocal(reservation.price, reservation.price_currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default SwipeableJobCard;
