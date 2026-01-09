import { useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Car, Edit, X, AlertTriangle, Ban } from 'lucide-react';
import { format, Locale, isToday, parseISO, startOfDay, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
  phone: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
}

interface AgencyReservationDetail {
  payment_status: string | null;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  status: string;
  driver_id: string | null;
  drivers?: Driver | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  agency_reservation_details?: AgencyReservationDetail | null;
}

interface SwipeableReservationCardProps {
  reservation: Reservation;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => Promise<void> | void;
  locale?: Locale;
}

const SWIPE_THRESHOLD = 80;

export const SwipeableReservationCard = ({ 
  reservation, 
  statusColors, 
  statusLabels,
  onView, 
  onEdit, 
  onCancel,
  locale 
}: SwipeableReservationCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { t } = useAgencyTranslations();
  const x = useMotionValue(0);

  // Check if reservation is same-day
  const isSameDayReservation = useMemo(() => {
    try {
      const pickupDate = parseISO(reservation.pickup_date);
      const today = startOfDay(new Date());
      return isSameDay(pickupDate, today);
    } catch {
      return false;
    }
  }, [reservation.pickup_date]);

  // Transform for background reveal
  const rightBgOpacity = useTransform(x, [-120, -40], [1, 0]);
  const leftBgOpacity = useTransform(x, [40, 120], [0, 1]);
  const rightIconScale = useTransform(x, [-120, -60], [1.2, 0.8]);
  const leftIconScale = useTransform(x, [60, 120], [0.8, 1.2]);

  // Haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 5, medium: 10, heavy: 20 };
      navigator.vibrate(durations[intensity]);
    }
  }, []);

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x < -30) {
      setSwipeDirection('left');
    } else if (info.offset.x > 30) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    setSwipeDirection(null);
    
    // Swipe left for edit
    if (offset < -SWIPE_THRESHOLD && onEdit && canEdit) {
      triggerHaptic('medium');
      onEdit();
    }
    // Swipe right for cancel - show confirmation dialog
    else if (offset > SWIPE_THRESHOLD && canCancel) {
      triggerHaptic('medium');
      
      // Check if same-day reservation
      if (isSameDayReservation) {
        triggerHaptic('heavy');
        // Don't allow same-day cancellations - show blocked state briefly
        return;
      }
      
      // Show confirmation dialog
      setShowCancelDialog(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!onCancel) return;
    
    setIsProcessing(true);
    triggerHaptic('heavy');
    
    try {
      await onCancel();
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };

  // Determine what actions are available based on status
  const canEdit = !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency', 'active'].includes(reservation.status);
  
  // Can cancel only if not completed/cancelled/active AND not same-day
  const canCancelStatus = !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency', 'active'].includes(reservation.status);
  const canCancel = canCancelStatus && !isSameDayReservation;
  const canSwipe = canEdit || canCancelStatus;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Right background (Cancel) - shown when swiping right */}
        {canCancelStatus && (
          <motion.div 
            className={cn(
              "absolute inset-y-0 left-0 w-full flex items-center justify-start pl-6 rounded-xl",
              isSameDayReservation ? "bg-muted" : "bg-destructive"
            )}
            style={{ opacity: leftBgOpacity }}
          >
            <motion.div 
              className={cn(
                "flex items-center gap-2 font-semibold",
                isSameDayReservation ? "text-muted-foreground" : "text-destructive-foreground"
              )}
              style={{ scale: leftIconScale }}
            >
              {isSameDayReservation ? (
                <>
                  <Ban className="h-6 w-6" />
                  <span>{t('sameDayCancelNotAllowed') || 'Aynı gün iptal edilemez'}</span>
                </>
              ) : (
                <>
                  <X className="h-6 w-6" />
                  <span>{t('cancel') || 'İptal'}</span>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
        
        {/* Left background (Edit) - shown when swiping left */}
        {canEdit && (
          <motion.div 
            className="absolute inset-y-0 right-0 w-full bg-primary flex items-center justify-end pr-6 rounded-xl"
            style={{ opacity: rightBgOpacity }}
          >
            <motion.div 
              className="flex items-center gap-2 text-primary-foreground font-semibold"
              style={{ scale: rightIconScale }}
            >
              <span>{t('edit') || 'Düzenle'}</span>
              <Edit className="h-6 w-6" />
            </motion.div>
          </motion.div>
        )}

        {/* Main Card */}
        <motion.div
          drag={canSwipe ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileTap={{ scale: 0.98 }}
          className="relative z-10"
        >
          <Card 
            className={cn(
              "cursor-pointer active:shadow-lg transition-shadow touch-manipulation",
              isProcessing && "opacity-50 pointer-events-none",
              swipeDirection === 'left' && "border-primary border-2",
              swipeDirection === 'right' && !isSameDayReservation && "border-destructive border-2",
              swipeDirection === 'right' && isSameDayReservation && "border-muted-foreground border-2"
            )}
            onClick={onView}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                <div className="min-w-0 flex-1">
                  {reservation.reservation_code && (
                    <span className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-0.5 rounded">
                      {reservation.reservation_code}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">{reservation.customer_name}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <Badge className={cn("text-[10px] sm:text-xs px-1.5 sm:px-2", statusColors[reservation.status] || 'bg-muted')}>
                    {statusLabels[reservation.status] || reservation.status}
                  </Badge>
                  {/* Same day badge */}
                  {isSameDayReservation && canCancelStatus && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-[10px] px-1.5">
                      {t('today') || 'Bugün'}
                    </Badge>
                  )}
                  {reservation.status === 'customer_approved' && !reservation.driver_id && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] px-1.5">
                      {t('awaitingDriverInfo')}
                    </Badge>
                  )}
                  {/* Cash payment warning badge */}
                  {reservation.agency_reservation_details?.payment_status === 'cash' && 
                   !reservation.passenger_cash_amount && 
                   !['completed', 'cancelled', 'cancelled_by_customer', 'cancelled_by_agency'].includes(reservation.status) && (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Badge className="bg-red-500 text-white border-red-600 text-[10px] px-1.5 animate-pulse">
                        💵 {t('cashRequired') || 'Nakit Girin'}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span>{format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale })}</span>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground ml-1 sm:ml-2 flex-shrink-0" />
                  <span>{reservation.pickup_time}</span>
                </div>

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

                {reservation.drivers && (
                  <div className="pt-1.5 sm:pt-2 border-t space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-green-700 text-xs sm:text-sm">{reservation.drivers.name}</span>
                    </div>
                    {reservation.drivers.plate_number && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground flex-wrap">
                        <span className="text-[10px] sm:text-xs">{t('plate')}:</span>
                        <span className="font-mono text-[10px] sm:text-xs">{reservation.drivers.plate_number}</span>
                        {reservation.drivers.vehicle_color && (
                          <span className="text-[10px] sm:text-xs">• {reservation.drivers.vehicle_color}</span>
                        )}
                      </div>
                    )}
                    {reservation.drivers.vehicle_model && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {reservation.drivers.vehicle_model}
                      </div>
                    )}
                  </div>
                )}

                {/* Cash amount display */}
                {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
                  <div className="pt-1.5 sm:pt-2 border-t">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg">💵</span>
                      <span className="font-semibold text-green-700 text-sm sm:text-base">
                        {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">({t('cashToCollect') || 'Alınacak Nakit'})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Swipe hints */}
              {canSwipe && (
                <div className="pt-2 mt-2 border-t border-dashed">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    {canCancelStatus && (
                      <span className={cn(
                        "flex items-center gap-1",
                        isSameDayReservation ? "text-muted-foreground/50 line-through" : "text-destructive/70"
                      )}>
                        ← {t('cancel') || 'İptal'}
                        {isSameDayReservation && <Ban className="h-3 w-3" />}
                      </span>
                    )}
                    {canEdit && (
                      <span className="flex items-center gap-1 text-primary/70 ml-auto">
                        {t('edit') || 'Düzenle'} →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('confirmCancel') || 'Rezervasyonu İptal Et'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('cancelConfirmMessage') || 'Bu rezervasyonu iptal etmek istediğinizden emin misiniz?'}
              </p>
              <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                <div className="font-medium">{reservation.customer_name}</div>
                <div className="text-muted-foreground">
                  {format(new Date(reservation.pickup_date), 'dd MMM yyyy', { locale })} - {reservation.pickup_time}
                </div>
                {reservation.reservation_code && (
                  <div className="font-mono text-xs">{reservation.reservation_code}</div>
                )}
              </div>
              <p className="text-destructive text-sm font-medium">
                {t('cancelWarning') || 'Bu işlem geri alınamaz.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isProcessing} className="w-full sm:w-auto">
              {t('goBack') || 'Vazgeç'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('confirmCancelButton') || 'Evet, İptal Et'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SwipeableReservationCard;
