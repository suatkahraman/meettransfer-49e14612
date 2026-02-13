import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Plane, Car, CreditCard, CheckCircle, Play, AlertCircle, Loader2, Ban, FileText, Building2, Banknote, Luggage, Baby, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { checkCompletionEligibility } from '@/hooks/useCompletionValidation';
import { toast } from 'sonner';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';

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
  payment_status?: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  driver_confirmed: boolean | null;
  agency_id?: string | null;
  luggage_count?: number | null;
  baby_seat_count?: number | null;
  pickup_place_name?: string | null;
  dropoff_place_name?: string | null;
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

export const SwipeableJobCard = ({ reservation, adminNotes, onAccept, onComplete, onClick }: SwipeableJobCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t, getPaymentTypeLabel } = useDriverTranslations();

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      pending: { label: t('pending') || 'Beklemede', color: 'text-gray-600', bgColor: 'bg-gray-500', icon: <AlertCircle className="h-4 w-4" /> },
      pending_admin_review: { label: t('pendingReview') || 'İncelemede', color: 'text-purple-600', bgColor: 'bg-purple-500', icon: <AlertCircle className="h-4 w-4" /> },
      sent_to_driver: { label: t('sentToDriver') || 'Şoföre Gönderildi', color: 'text-orange-600', bgColor: 'bg-orange-500', icon: <AlertCircle className="h-4 w-4" /> },
      assigned: { label: t('assigned') || 'Atandı', color: 'text-orange-600', bgColor: 'bg-orange-500', icon: <AlertCircle className="h-4 w-4" /> },
      confirmed: { label: t('updated') || 'Güncellendi', color: 'text-amber-600', bgColor: 'bg-amber-500', icon: <RefreshCw className="h-4 w-4" /> },
      active: { label: t('inProgress') || 'Devam Ediyor', color: 'text-blue-600', bgColor: 'bg-blue-500', icon: <Loader2 className="h-4 w-4" /> },
      completed: { label: t('completed') || 'Tamamlandı', color: 'text-green-600', bgColor: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
      cancelled: { label: t('cancelled') || 'İptal Edildi', color: 'text-red-600', bgColor: 'bg-red-500', icon: <Ban className="h-4 w-4" /> },
      cancelled_by_customer: { label: t('cancelledByCustomer') || 'Müşteri İptal', color: 'text-red-600', bgColor: 'bg-red-500', icon: <Ban className="h-4 w-4" /> },
      cancelled_by_agency: { label: t('cancelledByAgency') || 'Acenta İptal', color: 'text-red-600', bgColor: 'bg-red-500', icon: <Ban className="h-4 w-4" /> },
      no_show: { label: t('noShow') || 'Gelmedi', color: 'text-gray-600', bgColor: 'bg-gray-500', icon: <Ban className="h-4 w-4" /> },
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(reservation.status);
  const completionValidation = useMemo(() => {
    if (reservation.status === 'active') {
      return checkCompletionEligibility(reservation);
    }
    return { canComplete: false, reason: null, isCompleted: false };
  }, [reservation.pickup_date, reservation.pickup_time, reservation.status]);

  const isCancelledOrInactive = ['cancelled', 'cancelled_by_customer', 'cancelled_by_agency', 'no_show', 'completed'].includes(reservation.status);
  const canSwipeRight = !isCancelledOrInactive && (reservation.status === 'sent_to_driver' || reservation.status === 'assigned' || reservation.status === 'confirmed') && onAccept;
  const canSwipeLeft = !isCancelledOrInactive && reservation.status === 'active' && onComplete && completionValidation.canComplete;

  const handleAcceptClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAccept) return;
    setIsProcessing(true);
    try {
      await onAccept();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onComplete || !completionValidation.canComplete) {
      if (completionValidation.isCompleted) toast.error(t('alreadyCompleted'));
      else toast.error(completionValidation.reason || t('cannotCompleteNow'));
      return;
    }
    setIsProcessing(true);
    try {
      await onComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-xl">
      {/* Main Card - plain div, no Framer Motion */}
      <div className="relative z-10">
        <Card
          className={cn(
            "cursor-pointer active:shadow-lg transition-all duration-300 border-l-4 relative overflow-hidden min-h-[44px]",
            reservation.status === 'confirmed' && reservation.driver_confirmed === false
              ? "border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/30 dark:to-transparent"
              : reservation.agency_id ? "border-purple-500" : config.bgColor.replace('bg-', 'border-'),
            isProcessing && "opacity-50 pointer-events-none",
            isCancelledOrInactive && "opacity-60 grayscale-[30%]"
          )}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
          role="button"
          tabIndex={0}
        >
          {reservation.status === 'confirmed' && reservation.driver_confirmed === false && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none z-0 animate-pulse" />
          )}
          {isCancelledOrInactive && reservation.status !== 'completed' && (
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none z-10" />
          )}
          <CardContent className={cn("p-4 space-y-3 overflow-x-hidden break-words", isCancelledOrInactive && reservation.status !== 'completed' && "relative")}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium min-w-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{format(new Date(reservation.pickup_date), 'EEE, d MMM', { locale: tr })}</span>
                </div>
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{reservation.pickup_time}</span>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1.5">
                {reservation.status === 'confirmed' && reservation.driver_confirmed === false && (
                  <Badge className="w-fit flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/30 animate-pulse font-bold text-xs">
                    <RefreshCw className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Güncelleme var!</span>
                  </Badge>
                )}
                <Badge className={cn(
                  "w-fit flex items-center gap-1 px-2.5 py-1 text-xs",
                  (reservation.status === 'pending') && "bg-gray-500/20 text-gray-700 border-gray-500",
                  (reservation.status === 'pending_admin_review') && "bg-purple-500/20 text-purple-700 border-purple-500",
                  (reservation.status === 'sent_to_driver' || reservation.status === 'assigned') && "bg-orange-500/20 text-orange-700 border-orange-500",
                  reservation.status === 'confirmed' && reservation.driver_confirmed === false && "bg-amber-500/20 text-amber-700 border-amber-500",
                  reservation.status === 'confirmed' && reservation.driver_confirmed === true && "bg-green-500/20 text-green-700 border-green-500",
                  reservation.status === 'active' && "bg-blue-500/20 text-blue-700 border-blue-500",
                  reservation.status === 'completed' && "bg-green-500/20 text-green-700 border-green-500",
                  (reservation.status === 'cancelled' || reservation.status === 'cancelled_by_customer' || reservation.status === 'cancelled_by_agency') && "bg-red-500/20 text-red-700 border-red-500",
                  reservation.status === 'no_show' && "bg-gray-500/20 text-gray-700 border-gray-500"
                )}>
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              </div>
            </div>

            {reservation.agency_id || reservation.agencies ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2 shadow-sm min-w-0">
                <div className="bg-purple-500 p-1.5 rounded-full">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-purple-800 dark:text-purple-200 truncate">
                  {t('agencyReservation')}: {reservation.agencies?.agency_name || 'Acenta'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 shadow-sm min-w-0">
                <div className="bg-blue-500 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-200 truncate">
                  {t('guestReservation') || 'Misafir Rezervasyonu'}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-muted/50 rounded-lg px-3 py-2 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate sm:max-w-[55%]">{reservation.customer_name}</span>
              <span className="text-muted-foreground text-sm sm:ml-auto truncate">{reservation.customer_phone}</span>
            </div>

            <div className="space-y-2">
              <LocationDisplay placeName={reservation.pickup_place_name} address={reservation.pickup} type="pickup" size="sm" />
              <LocationDisplay placeName={reservation.dropoff_place_name} address={reservation.dropoff} type="dropoff" size="sm" />
            </div>

            <div className="flex flex-wrap gap-2">
              {reservation.flight_number && (
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                  <Plane className="h-3 w-3" />
                  <span>{reservation.flight_number}</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                <Car className="h-3 w-3" />
                <span>{reservation.vehicle_type}</span>
              </div>
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs text-red-600">
                <CreditCard className="h-3 w-3" />
                <span>{getPaymentTypeLabel(reservation.payment_type)}</span>
              </div>
              <PaymentStatusBadge status={reservation.payment_status} size="sm" />
              {!reservation.agency_id && reservation.price && reservation.price > 0 && (
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  <span>B {getCurrencySymbol(reservation.price_currency)}{reservation.price.toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>

            {((reservation.luggage_count && reservation.luggage_count > 0) || (reservation.baby_seat_count && reservation.baby_seat_count > 0)) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {reservation.luggage_count && reservation.luggage_count > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 rounded-lg shadow-md">
                    <div className="bg-white/20 p-1.5 rounded-full">
                      <Luggage className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-white">
                      <span className="text-lg font-bold">{reservation.luggage_count}</span>
                      <span className="text-xs ml-1 opacity-90">{t('luggage') || 'Bavul'}</span>
                    </div>
                  </div>
                )}
                {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-2 rounded-lg shadow-md">
                    <div className="bg-white/20 p-1.5 rounded-full">
                      <Baby className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-white">
                      <span className="text-lg font-bold">{reservation.baby_seat_count}</span>
                      <span className="text-xs ml-1 opacity-90">{t('babySeat') || 'Bebek Koltuğu'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl px-4 py-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm text-white/90 font-medium">{t('cashToCollect')}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-black text-2xl text-white drop-shadow-sm">
                      {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount.toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Action buttons - Accept/Complete instead of swipe */}
            <div className="pt-2 border-t flex flex-wrap gap-2">
              {canSwipeRight && (
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-medium"
                >
                  <Play className="h-4 w-4" />
                  {t('accept')}
                </button>
              )}
              {reservation.status === 'active' && onComplete && !completionValidation.canComplete && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 py-2">
                  <Ban className="h-3 w-3" />
                  {t('cannotCompleteNow')}
                </span>
              )}
              {canSwipeLeft && (
                <button
                  type="button"
                  onClick={handleCompleteClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('complete')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default SwipeableJobCard;
