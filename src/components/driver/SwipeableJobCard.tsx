import { useState, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, User, Plane, Car, CreditCard, CheckCircle, Play, AlertCircle, Loader2, Ban, AlertTriangle, FileText, Building2, Banknote, Luggage, Baby, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { checkCompletionEligibility } from '@/hooks/useCompletionValidation';
import { toast } from 'sonner';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { supabase } from '@/integrations/supabase/client';
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
  agency_id?: string | null;
  luggage_count?: number | null;
  baby_seat_count?: number | null;
  // Place details
  pickup_place_name?: string | null;
  dropoff_place_name?: string | null;
  // Agency details
  agencies?: {
    id: string;
    agency_name: string;
  } | null;
}

interface SwipeableJobCardProps {
  reservation: Reservation;
  adminNotes?: string | null;
  onAccept?: () => Promise<void>;
  onComplete?: () => Promise<void>;
  onClick?: () => void;
}

const SWIPE_THRESHOLD = 100;

export const SwipeableJobCard = ({ reservation, adminNotes, onAccept, onComplete, onClick }: SwipeableJobCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [flightDelay, setFlightDelay] = useState<number | null>(null);
  const [flightStatusValue, setFlightStatusValue] = useState<string | null>(null);
  const [tryAmount, setTryAmount] = useState<number | null>(null);
  const { t, getPaymentTypeLabel } = useDriverTranslations();
  const x = useMotionValue(0);

  // Fetch TL equivalent when cash amount is not in TRY
  useEffect(() => {
    const fetchTryAmount = async () => {
      if (
        reservation.passenger_cash_amount &&
        reservation.passenger_cash_amount > 0 &&
        reservation.passenger_cash_currency &&
        reservation.passenger_cash_currency !== 'TRY'
      ) {
        try {
          const { data, error } = await supabase.functions.invoke('get-exchange-rate', {
            body: {
              from_currency: reservation.passenger_cash_currency,
              to_currency: 'TRY',
              amount: reservation.passenger_cash_amount
            }
          });
          if (!error && data?.converted_amount) {
            setTryAmount(Math.round(data.converted_amount));
          }
        } catch (err) {
          console.error('Failed to fetch TRY amount:', err);
        }
      }
    };
    fetchTryAmount();
  }, [reservation.passenger_cash_amount, reservation.passenger_cash_currency]);
  
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      sent_to_driver: { 
        label: t('pending'), 
        color: 'text-orange-600',
        bgColor: 'bg-orange-500',
        icon: <AlertCircle className="h-4 w-4" />
      },
      assigned: { 
        label: t('assigned'), 
        color: 'text-orange-600',
        bgColor: 'bg-orange-500',
        icon: <AlertCircle className="h-4 w-4" />
      },
      confirmed: { 
        label: t('updated') || 'Güncellendi', 
        color: 'text-amber-600',
        bgColor: 'bg-amber-500',
        icon: <RefreshCw className="h-4 w-4" />
      },
      active: { 
        label: t('inProgress'), 
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        icon: <Loader2 className="h-4 w-4" />
      },
      completed: { 
        label: t('completed'), 
        color: 'text-green-600',
        bgColor: 'bg-green-500',
        icon: <CheckCircle className="h-4 w-4" />
      },
      cancelled: { 
        label: t('cancelled') || 'İptal Edildi', 
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <Ban className="h-4 w-4" />
      },
      cancelled_by_customer: { 
        label: t('cancelledByCustomer') || 'Müşteri İptal', 
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <Ban className="h-4 w-4" />
      },
      cancelled_by_agency: { 
        label: t('cancelledByAgency') || 'Acenta İptal', 
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <Ban className="h-4 w-4" />
      },
    };
    return configs[status] || configs.sent_to_driver;
  };
  
  const config = getStatusConfig(reservation.status);
  
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
    if (price === null || price === undefined) return t('none');
    return `${getCurrencySymbol(currency)}${price.toLocaleString('tr-TR')}`;
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (offset < -SWIPE_THRESHOLD && reservation.status === 'active' && onComplete) {
      // Validate before completing
      if (!completionValidation.canComplete) {
        if (completionValidation.isCompleted) {
          toast.error(t('alreadyCompleted'));
        } else {
          toast.error(completionValidation.reason || t('cannotCompleteNow'));
        }
        return;
      }
      setIsProcessing(true);
      await onComplete();
      setIsProcessing(false);
    } else if (offset > SWIPE_THRESHOLD && (reservation.status === 'sent_to_driver' || reservation.status === 'assigned' || reservation.status === 'confirmed') && onAccept) {
      setIsProcessing(true);
      await onAccept();
      setIsProcessing(false);
    }
  };

  const canSwipeRight = (reservation.status === 'sent_to_driver' || reservation.status === 'assigned' || reservation.status === 'confirmed') && onAccept;
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
            <span>{t('accept')}</span>
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
            <span>{t('complete')}</span>
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
            // Agency reservations get purple border, guest reservations get status color
            reservation.agency_id ? "border-purple-500" : config.bgColor.replace('bg-', 'border-'),
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
                  <span>{format(new Date(reservation.pickup_date), 'EEEE, d MMMM', { locale: tr })}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{reservation.pickup_time}</span>
                </div>
              </div>
              <Badge className={cn(
                "flex items-center gap-1 px-3 py-1",
                (reservation.status === 'sent_to_driver' || reservation.status === 'assigned') && "bg-orange-500/20 text-orange-700 border-orange-500",
                reservation.status === 'confirmed' && "bg-amber-500/20 text-amber-700 border-amber-500 animate-pulse",
                reservation.status === 'active' && "bg-blue-500/20 text-blue-700 border-blue-500",
                reservation.status === 'completed' && "bg-green-500/20 text-green-700 border-green-500",
                (reservation.status === 'cancelled' || reservation.status === 'cancelled_by_customer' || reservation.status === 'cancelled_by_agency') && "bg-red-500/20 text-red-700 border-red-500"
              )}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
            </div>

            {/* Agency or Guest Badge */}
            {reservation.agency_id || reservation.agencies ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2 shadow-sm">
                <div className="bg-purple-500 p-1.5 rounded-full">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                  {t('agencyReservation')}: {reservation.agencies?.agency_name || 'Acenta'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 shadow-sm">
                <div className="bg-blue-500 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                  {t('guestReservation') || 'Misafir Rezervasyonu'}
                </span>
              </div>
            )}

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
                      <span>+{flightDelay} min</span>
                    </div>
                  )}
                  {flightStatusValue === 'cancelled' && (
                    <div className="flex items-center gap-1 bg-destructive/20 border border-destructive/50 px-2 py-1 rounded text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{t('cancel')}</span>
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
                <span>{getPaymentTypeLabel(reservation.payment_type)}</span>
              </div>
              {reservation.price && reservation.price > 0 && (
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  <span>B {getCurrencySymbol(reservation.price_currency)}{reservation.price.toLocaleString('tr-TR')}</span>
                </div>
              )}
              {reservation.luggage_count && reservation.luggage_count > 0 && (
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-400 font-medium">
                  <Luggage className="h-3 w-3" />
                  <span>{reservation.luggage_count}</span>
                </div>
              )}
              {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                <div className="flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 px-2 py-1 rounded text-xs text-pink-700 dark:text-pink-400 font-medium">
                  <Baby className="h-3 w-3" />
                  <span>{reservation.baby_seat_count}</span>
                </div>
              )}
            </div>

            {/* Passenger Cash Amount - Prominent Display */}
            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl px-4 py-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-white/90 font-medium">{t('cashToCollect')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-2xl text-white drop-shadow-sm">
                      {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString('tr-TR')}
                    </div>
                    {/* TL equivalent */}
                    {tryAmount && reservation.passenger_cash_currency !== 'TRY' && (
                      <div className="text-sm text-white/80 font-medium">
                        ≈ ₺{tryAmount.toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {adminNotes && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">{t('adminNotes')}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-300 line-clamp-2">{adminNotes}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Swipe hints - No price shown to drivers */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                {canSwipeRight && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {t('accept')} →
                  </span>
                )}
                {reservation.status === 'active' && onComplete && !completionValidation.canComplete && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3" />
                    {t('cannotCompleteNow')}
                  </span>
                )}
                {canSwipeLeft && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    ← {t('complete')}
                    <CheckCircle className="h-3 w-3" />
                  </span>
                )}
                {!canSwipeRight && !canSwipeLeft && reservation.status !== 'active' && <span />}
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