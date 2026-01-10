import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Car, Phone, User, Users, Check, X, Plane, Edit, XCircle, AlertTriangle, CreditCard, Banknote, CheckCircle2, Clock3, Map, Home, Bell, BellOff, MessageCircle, Tag, Briefcase, Baby, Sparkles, RefreshCw, Shield, ClipboardCopy, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, CURRENCY_SYMBOLS } from '@/lib/currency';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { LocationDisplay } from '@/components/ui/location-display';
import MissingInfoAlerts from '@/components/customer/MissingInfoAlerts';
import { ReviewPromptBanner } from '@/components/customer/ReviewPromptBanner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/agency/PullToRefreshIndicator';
import { WHATSAPP_NUMBER, getWhatsAppUrl } from '@/lib/contact';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes-vito',
  'vip-mercedes': 'Vip Mercedes',
  'maybach-minibus': 'Maybach Minibus',
  'minibus': 'Minibus',
  // Legacy support
  'mercedes-vclass': 'Vip Mercedes',
  'maybach': 'Maybach Minibus',
};

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  flight_arrival_time: string | null;
  flight_status: string | null;
  vehicle_type: string;
  payment_type: string;
  payment_status: string | null;
  payment_link: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  status: string;
  driver_id: string | null;
  passenger_names: string[] | null;
  promo_code: string | null;
  is_return_transfer: boolean | null;
  original_reservation_id: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  // Place details
  pickup_place_name: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_place_name: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  drivers?: {
    name: string;
    plate_number: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  'awaiting-price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
  'pending_admin_review': 'bg-amber-500/20 text-amber-700',
  'cancelled_by_customer': 'bg-destructive/20 text-destructive',
  'cancelled_by_agency': 'bg-destructive/20 text-destructive',
  'cancelled': 'bg-destructive/20 text-destructive',
};


const CustomerReservationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { emailAdminPriceAccepted, emailAdminPriceRejected, emailAdminReservationCancelled, emailDriverReservationCancelled } = useEmailNotifications();
  const { isSubscribed, subscribe, unsubscribe, isLoading: pushLoading
 } = usePushNotifications();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [linkedReservation, setLinkedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [flightDelay, setFlightDelay] = useState<number | null>(null);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);
  const [canReject, setCanReject] = useState(true);
  const [isDiscountedOffer, setIsDiscountedOffer] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'awaiting-price': t('statusPendingPrice'),
      'waiting_for_customer_approval': t('statusActionRequired'),
      'customer_approved': t('statusConfirmed'),
      'customer_rejected': t('statusCancelled'),
      'sent_to_driver': t('statusDriverAssigned'),
      'active': t('statusInProgress'),
      'completed': t('statusCompleted'),
      'pending_admin_review': t('statusUnderReview'),
      'cancelled_by_customer': t('statusCancelledByCustomer'),
      'cancelled_by_agency': t('statusCancelledByAgency'),
      'cancelled': t('statusCancelled'),
    };
    return labels[status] || status;
  };

  const fetchReservation = useCallback(async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers (name, plate_number, vehicle_model, vehicle_color)
      `)
      .eq('id', id)
      .eq('customer_id', user.id)
      .single();

    if (error) {
      toast.error('Reservation not found');
      navigate('/customer/bookings');
      return;
    }

    setReservation(data);
    
    // Check price history to determine if this is a discounted offer
    // and whether the reject button should be shown
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .eq('reservation_id', id)
      .in('action', ['rejected', 'auto_discount'])
      .order('created_at', { ascending: false });
    
    if (priceHistory) {
      const rejectionCount = priceHistory.filter(h => h.action === 'rejected').length;
      const hasAutoDiscount = priceHistory.some(h => h.action === 'auto_discount');
      
      // If there's already been an auto_discount applied, this is the discounted offer
      setIsDiscountedOffer(hasAutoDiscount);
      
      // Can only reject if no auto_discount has been applied yet
      setCanReject(!hasAutoDiscount);
      
      console.log(`Rejection count: ${rejectionCount}, Has auto discount: ${hasAutoDiscount}, Can reject: ${!hasAutoDiscount}`);
    }
    
    // Fetch linked reservation (return trip) if this is the outbound or if this has original_reservation_id
    if (data) {
      // If this is outbound, find the return trip that references this reservation
      const { data: returnTrip } = await supabase
        .from('reservations')
        .select('*')
        .eq('original_reservation_id', data.id)
        .eq('customer_id', user.id)
        .single();
      
      if (returnTrip) {
        setLinkedReservation(returnTrip);
      } else if (data.original_reservation_id) {
        // If this is the return trip, fetch the outbound trip
        const { data: outboundTrip } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', data.original_reservation_id)
          .eq('customer_id', user.id)
          .single();
        
        if (outboundTrip) {
          setLinkedReservation(outboundTrip);
        }
      }
    }

    // Check if review already exists for completed reservations
    if (data && data.status === 'completed' && data.driver_id) {
      const { data: reviewData } = await supabase
        .from('driver_reviews')
        .select('id')
        .eq('reservation_id', data.id)
        .single();
      
      setHasReview(!!reviewData);
    } else {
      setHasReview(false);
    }
    
    setLoading(false);
  }, [id, user, navigate]);

  // Pull to refresh
  const handlePullRefresh = useCallback(async () => {
    await fetchReservation();
    toast.success(language === 'TR' ? 'Yenilendi!' : 'Refreshed!');
  }, [fetchReservation, language]);

  const { pullDistance, isRefreshing: isPullRefreshing, isPulling, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: loading
  });

  useEffect(() => {
    fetchReservation();
  }, [id, user, navigate]);

  // Real-time subscription for reservation updates (including flight changes)
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`customer-reservation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Reservation updated:', payload);
          const newData = payload.new as any;
          
          // Check if flight info changed
          if (reservation && newData.flight_arrival_time !== reservation.flight_arrival_time) {
            toast.info('Flight arrival time has been updated');
          }
          
          // Refetch to get updated drivers relation
          fetchReservation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, reservation?.flight_arrival_time]);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return null;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price}`;
  };

  // Check if pickup date is in the past (not today, only past)
  const isPickupDatePast = () => {
    if (!reservation) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDate = new Date(reservation.pickup_date);
    pickupDate.setHours(0, 0, 0, 0);
    return pickupDate.getTime() < today.getTime(); // Only past, not today
  };

  // Check if cancellation is allowed (at least 24 hours before pickup)
  const canCancelWithin24Hours = () => {
    if (!reservation) return false;
    const now = new Date();
    const pickupDateTime = new Date(`${reservation.pickup_date}T${reservation.pickup_time}`);
    const hoursUntilPickup = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilPickup >= 24;
  };

  const hoursUntilPickup = () => {
    if (!reservation) return 0;
    const now = new Date();
    const pickupDateTime = new Date(`${reservation.pickup_date}T${reservation.pickup_time}`);
    return Math.max(0, Math.floor((pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
  };

  const canEdit = reservation && 
    !isPickupDatePast() && 
    ['customer_approved', 'confirmed', 'sent_to_driver', 'waiting_for_customer_approval', 'pending_admin_review'].includes(reservation.status);
  const canCancel = reservation && 
    !isPickupDatePast() && 
    canCancelWithin24Hours() &&
    ['customer_approved', 'confirmed', 'sent_to_driver', 'waiting_for_customer_approval'].includes(reservation.status);

  // Generate reservation details text for sharing
  const getReservationDetailsText = () => {
    if (!reservation) return '';
    
    const formattedDate = format(new Date(reservation.pickup_date), 'dd MMM yyyy');
    const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name, index) => `   ${index + 1}. ${name}`).join('\n')
      : '   —';

    const lines = [
      `🚖 *${language === 'TR' ? 'TRANSFERİM' : 'MY TRANSFER'}*`,
      `━━━━━━━━━━━━━━━━━`,
      ``,
      reservation.reservation_code ? `🎫 *${language === 'TR' ? 'Kod' : 'Code'}:* ${reservation.reservation_code}` : null,
      `📅 *${language === 'TR' ? 'Tarih' : 'Date'}:* ${formattedDate}`,
      `🕐 *${language === 'TR' ? 'Saat' : 'Time'}:* ${reservation.pickup_time}`,
      ``,
      `🟢 *${language === 'TR' ? 'Alış Noktası' : 'Pickup'}:*`,
      reservation.pickup_place_name || reservation.pickup,
      ``,
      `🔴 *${language === 'TR' ? 'Varış Noktası' : 'Dropoff'}:*`,
      reservation.dropoff_place_name || reservation.dropoff,
      ``,
      reservation.flight_number ? `✈️ *${language === 'TR' ? 'Uçuş' : 'Flight'}:* ${reservation.flight_number}` : null,
      `🚗 *${language === 'TR' ? 'Araç' : 'Vehicle'}:* ${vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}`,
      reservation.luggage_count ? `🧳 *${language === 'TR' ? 'Valiz' : 'Luggage'}:* ${reservation.luggage_count}` : null,
      reservation.baby_seat_count ? `👶 *${language === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}:* ${reservation.baby_seat_count}` : null,
      reservation.drivers ? `\n👤 *${language === 'TR' ? 'Şoför' : 'Driver'}:* ${reservation.drivers.name}` : null,
      reservation.drivers?.plate_number ? `🚙 *${language === 'TR' ? 'Plaka' : 'Plate'}:* ${reservation.drivers.plate_number}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━`,
    ].filter(Boolean).join('\n');

    return lines;
  };

  const copyReservationDetails = async () => {
    const lines = getReservationDetailsText();
    if (!lines) return;

    try {
      await navigator.clipboard.writeText(lines);
      toast.success(language === 'TR' ? 'Rezervasyon detayları kopyalandı' : 'Reservation details copied');
    } catch (err) {
      toast.error(language === 'TR' ? 'Kopyalama başarısız' : 'Copy failed');
    }
  };

  const shareViaWhatsApp = () => {
    const lines = getReservationDetailsText();
    if (!lines) return;
    window.open(getWhatsAppUrl(lines), '_blank');
  };

  const handleAcceptPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_approved' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Record in price history
      if (reservation.price) {
        try {
          await supabase.from('price_history').insert({
            reservation_id: reservation.id,
            price: reservation.price,
            price_currency: reservation.price_currency || 'TRY',
            action: 'accepted',
          });
        } catch (e) {
          console.error('Failed to record price history:', e);
        }
      }

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_accepted',
            title: 'Customer Accepted Price',
            message: `Reservation #${reservation.id.slice(0, 8)} is confirmed. Price: ${formatPrice(reservation.price, reservation.price_currency)}`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about price acceptance
      try {
        await emailAdminPriceAccepted(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      toast.success('Price accepted! Your transfer is confirmed.');
      setReservation({ ...reservation, status: 'customer_approved' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept price');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPrice = async () => {
    if (!reservation) return;
    setActionLoading(true);

    try {
      // Record the rejection in price history first
      if (reservation.price) {
        try {
          await supabase.from('price_history').insert({
            reservation_id: reservation.id,
            price: reservation.price,
            price_currency: reservation.price_currency || 'TRY',
            action: 'rejected',
          });
        } catch (e) {
          console.error('Failed to record price history:', e);
        }
      }

      // If this is the first rejection, apply auto discount instead of cancelling
      if (canReject && !isDiscountedOffer) {
        try {
          const { data: discountResult, error: discountError } = await supabase.functions.invoke('apply-auto-discount', {
            body: { reservation_id: reservation.id }
          });

          if (discountError) {
            console.error('Auto discount error:', discountError);
            throw discountError;
          }

          if (discountResult?.success) {
            toast.success(
              t('autoDiscountApplied') || 
              `Fiyat indirildi! Yeni fiyat: ${getCurrencySymbol(discountResult.currency)}${discountResult.new_price}`
            );
            
            // Update local state
            setReservation({ 
              ...reservation, 
              price: discountResult.new_price,
              status: 'waiting_for_customer_approval',
              discount_amount: discountResult.discount_amount,
            });
            setIsDiscountedOffer(true);
            setCanReject(false);
            
            return; // Don't proceed to cancel
          }
        } catch (e) {
          console.error('Failed to apply auto discount:', e);
          // If auto discount fails, proceed with normal rejection
        }
      }

      // If auto discount already applied or failed, proceed with cancellation
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'customer_rejected' })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'price_rejected',
            title: 'Customer Declined Price',
            message: `Reservation #${reservation.id.slice(0, 8)} was declined by customer.`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about price rejection
      try {
        await emailAdminPriceRejected(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      toast.success('Reservation cancelled.');
      setReservation({ ...reservation, status: 'customer_rejected' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    setCancelLoading(true);

    try {
      const driverId = reservation.driver_id;

      // Update reservation status and remove driver
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled_by_customer',
          driver_id: null,
        })
        .eq('id', reservation.id);

      if (error) throw error;

      // Notify admin (in-app)
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            type: 'reservation_cancelled',
            title: 'Customer Cancelled Reservation',
            message: `A customer cancelled reservation #${reservation.id.slice(0, 8)}.`,
            notify_admins: true,
            reservation_id: reservation.id,
            send_push: true,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Send email to admin about cancellation
      try {
        await emailAdminReservationCancelled(reservation.id);
      } catch (e) {
        console.error('Failed to send admin email:', e);
      }

      // Notify driver if one was assigned
      if (driverId) {
        try {
          const { data: driver } = await supabase
            .from('drivers')
            .select('user_id')
            .eq('id', driverId)
            .single();

          if (driver?.user_id) {
            // Send in-app notification to driver
            await supabase.functions.invoke('create-notification', {
              body: {
                user_id: driver.user_id,
                reservation_id: reservation.id,
                title: 'Reservation Cancelled',
                message: `Reservation #${reservation.id.slice(0, 8)} has been cancelled by the customer.`,
                type: 'reservation_cancelled',
                send_push: true
              }
            });
          }
        } catch (e) {
          console.error('Failed to notify driver:', e);
        }

        // Send email to driver about cancellation
        try {
          await emailDriverReservationCancelled(reservation.id);
        } catch (e) {
          console.error('Failed to send driver cancellation email:', e);
        }
      }

      toast.success('Reservation cancelled successfully.');
      setReservation({ ...reservation, status: 'cancelled_by_customer', driver_id: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(false);
    }
  };

  // Animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 mx-auto text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!reservation) return null;

  const priceDisplay = formatPrice(reservation.price, reservation.price_currency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Modern Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-primary text-primary-foreground py-4 px-4 shadow-lg backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" onClick={() => navigate('/customer/bookings')} className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <img src={meetTransferLogo} alt="Meet Transfer" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => isSubscribed ? unsubscribe() : subscribe()}
                disabled={pushLoading}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                title={isSubscribed ? 'Notifications On' : 'Notifications Off'}
              >
                {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 opacity-60" />}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto py-6 px-4 max-w-2xl"
        {...pullHandlers}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isPullRefreshing}
          isPulling={isPulling}
          language={language === 'TR' ? 'TR' : 'EN'}
        />
        {/* Premium Title Section with Status Tracker */}
        <motion.div variants={itemVariants} className="mb-6">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">{t('reservationDetails')}</h1>
                  {reservation.reservation_code && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                        <Shield className="h-3 w-3 mr-1" />
                        {reservation.reservation_code}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status Progress Tracker */}
              <div className="bg-background/50 rounded-xl p-4 border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {language === 'TR' ? 'Transfer Durumu' : 'Transfer Status'}
                  </span>
                  <Badge className={cn(statusColors[reservation.status] || 'bg-muted', "px-3 py-1 font-medium")}>
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center gap-1">
                  {['awaiting-price', 'waiting_for_customer_approval', 'customer_approved', 'sent_to_driver', 'completed'].map((step, index) => {
                    const stepLabels: Record<string, { en: string; tr: string }> = {
                      'awaiting-price': { en: 'Price', tr: 'Fiyat' },
                      'waiting_for_customer_approval': { en: 'Approval', tr: 'Onay' },
                      'customer_approved': { en: 'Confirmed', tr: 'Onaylandı' },
                      'sent_to_driver': { en: 'Driver', tr: 'Şoför' },
                      'completed': { en: 'Done', tr: 'Bitti' },
                    };
                    
                    const stepOrder = ['awaiting-price', 'waiting_for_customer_approval', 'customer_approved', 'sent_to_driver', 'active', 'completed'];
                    const currentIndex = stepOrder.indexOf(reservation.status);
                    const stepIndex = stepOrder.indexOf(step);
                    const isActive = currentIndex >= stepIndex;
                    const isCurrent = reservation.status === step || 
                      (reservation.status === 'active' && step === 'sent_to_driver');
                    const isCancelled = reservation.status.includes('cancelled') || reservation.status === 'customer_rejected';
                    
                    if (isCancelled) return null;
                    
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center gap-1">
                        <div className={cn(
                          "h-2 w-full rounded-full transition-all",
                          isActive ? "bg-primary" : "bg-muted",
                          isCurrent && "animate-pulse"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {stepLabels[step]?.[language === 'TR' ? 'tr' : 'en'] || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Cancelled Status */}
                {(reservation.status.includes('cancelled') || reservation.status === 'customer_rejected') && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-lg">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      {language === 'TR' ? 'Rezervasyon İptal Edildi' : 'Reservation Cancelled'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-border/50 overflow-hidden backdrop-blur-sm bg-card/95">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  {t('transferDetailsTitle')}
                </CardTitle>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className={cn(statusColors[reservation.status] || 'bg-muted', "px-3 py-1 font-medium")}>
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </motion.div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Date & Time - Enhanced */}
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-4 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 -mx-2"
              >
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {format(new Date(reservation.pickup_date), 'PPP')}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{reservation.pickup_time}</span>
                </div>
              </motion.div>

              {/* Route - Enhanced */}
              <motion.div variants={itemVariants} className="space-y-3">
                <LocationDisplay
                  placeName={reservation.pickup_place_name}
                  address={reservation.pickup}
                  type="pickup"
                  size="md"
                />
                <LocationDisplay
                  placeName={reservation.dropoff_place_name}
                  address={reservation.dropoff}
                  type="dropoff"
                  size="md"
                />
              </motion.div>

              {/* Route Map - Enhanced */}
              <motion.div variants={itemVariants} className="py-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{t('routeMap')}</span>
                </div>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <GoogleRouteMap
                    pickup={reservation.pickup}
                    dropoff={reservation.dropoff}
                    showNavigationButtons={false}
                  />
                </div>
              </motion.div>

              {/* Share Buttons */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 py-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={copyReservationDetails}
                  className="w-full"
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  {language === 'TR' ? 'Kopyala' : 'Copy'}
                </Button>
                <Button
                  onClick={shareViaWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </motion.div>

            {/* Passengers */}
            {reservation.passenger_names && reservation.passenger_names.length > 0 && (
              <div className="space-y-2 py-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('passengers')} ({reservation.passenger_names.length})</span>
                </div>
                <div className="pl-6 space-y-1">
                  {reservation.passenger_names.map((name, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flight & Vehicle */}
            <div className="flex items-center justify-between py-4 border-t border-b">
              <div className="flex items-center gap-2">
                {reservation.flight_number ? (
                  <AirlineDisplay flightNumber={reservation.flight_number} size="sm" />
                ) : (
                  <>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('noFlightInfo')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
              </div>
            </div>

            {/* Luggage and Baby Seat Info */}
            {((reservation.luggage_count && reservation.luggage_count > 0) || (reservation.baby_seat_count && reservation.baby_seat_count > 0)) && (
              <div className="flex flex-wrap gap-3 py-4 border-t">
                {reservation.luggage_count && reservation.luggage_count > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {reservation.luggage_count} {t('luggage') || 'Luggage'}
                    </span>
                  </div>
                )}
                {reservation.baby_seat_count && reservation.baby_seat_count > 0 && (
                  <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-2">
                    <Baby className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                      {reservation.baby_seat_count} {t('babySeat') || 'Baby Seat'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Flight Status with Delay Alert */}
            {reservation.flight_number && (
              <div className="space-y-3">
                {/* Stored Flight Info - Always show if available */}
                {(reservation.flight_arrival_time || reservation.flight_status) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Plane className="h-4 w-4" />
                      Flight Information
                    </div>
                    <div className="flex items-center justify-between">
                      {reservation.flight_arrival_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Estimated Arrival</div>
                            <div className="text-xl font-bold text-primary">{reservation.flight_arrival_time}</div>
                          </div>
                        </div>
                      )}
                      {reservation.flight_status && (
                        <Badge 
                          className={cn(
                            "capitalize",
                            reservation.flight_status === 'delayed' && "bg-amber-500/20 text-amber-700 border-amber-300",
                            reservation.flight_status === 'landed' && "bg-green-500/20 text-green-700 border-green-300",
                            reservation.flight_status === 'cancelled' && "bg-destructive/20 text-destructive",
                            reservation.flight_status === 'active' && "bg-blue-500/20 text-blue-700",
                            reservation.flight_status === 'scheduled' && "bg-muted text-muted-foreground"
                          )}
                        >
                          {reservation.flight_status === 'delayed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {reservation.flight_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Delay Alert Banner */}
                {(flightDelay && flightDelay > 0) || reservation.flight_status === 'delayed' ? (
                  <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-700">Flight Delayed</div>
                      <div className="text-sm text-amber-600">
                        Your flight {reservation.flight_number} is delayed{flightDelay ? ` by ${flightDelay} minutes` : ''}. 
                        Your driver will be notified automatically.
                      </div>
                    </div>
                  </div>
                ) : null}
                {(flightStatus === 'cancelled' || reservation.flight_status === 'cancelled') && (
                  <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-destructive">Flight Cancelled</div>
                      <div className="text-sm text-destructive/80">
                        Your flight {reservation.flight_number} has been cancelled. 
                        Please contact us to reschedule your transfer.
                      </div>
                    </div>
                  </div>
                )}
                <FlightStatus 
                  flightNumber={reservation.flight_number} 
                  date={reservation.pickup_date}
                  refreshIntervalMs={5 * 60 * 1000}
                  reservationId={reservation.id}
                  onStatusChange={(status) => {
                    const delay = status.arrival?.delay || status.departure?.delay || 0;
                    setFlightDelay(delay);
                    setFlightStatus(status.status?.toLowerCase() || null);
                  }}
                  onArrivalTimeChange={(newTime) => {
                    if (newTime && reservation.flight_arrival_time !== newTime) {
                      setReservation(prev => prev ? { ...prev, flight_arrival_time: newTime } : prev);
                    }
                  }}
                />
              </div>
            )}

            {/* Price Section - only show if price is set */}
            {priceDisplay && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {/* Check if this is part of a return trip with discount */}
                {linkedReservation && reservation.promo_code ? (
                  <>
                    {/* Outbound & Return Trip Price Breakdown */}
                    <div className="space-y-3">
                      {/* Determine which is outbound and which is return */}
                      {(() => {
                        const isThisReturn = reservation.is_return_transfer;
                        const outbound = isThisReturn ? linkedReservation : reservation;
                        const returnTrip = isThisReturn ? reservation : linkedReservation;
                        const outboundPrice = outbound.price || 0;
                        const returnOriginalPrice = returnTrip.price || 0;
                        // Return trip gets 30% discount with promo code
                        const returnDiscountedPrice = Math.round(returnOriginalPrice * 0.7);
                        const discountAmount = returnOriginalPrice - returnDiscountedPrice;
                        const totalPrice = outboundPrice + returnDiscountedPrice;
                        const currency = reservation.price_currency;
                        
                        return (
                          <>
                            {/* Outbound Price */}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t('outbound') || 'Outbound'}</span>
                              <span className="font-medium">{formatPrice(outboundPrice, currency)}</span>
                            </div>
                            
                            {/* Return Price with Discount */}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t('returnTrip') || 'Return'}</span>
                              <div className="text-right">
                                <span className="text-muted-foreground line-through text-sm mr-2">
                                  {formatPrice(returnOriginalPrice, currency)}
                                </span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {formatPrice(returnDiscountedPrice, currency)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Discount Line */}
                            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                <span className="text-sm">
                                  {t('discount') || 'Discount'} ({reservation.promo_code})
                                </span>
                              </div>
                              <span className="font-medium">-{formatPrice(discountAmount, currency)}</span>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="font-medium">{t('total') || 'Total'}</span>
                              <span className="font-bold text-primary text-2xl">{formatPrice(totalPrice, currency)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : reservation.promo_code && reservation.price && reservation.is_return_transfer ? (
                  // Single return trip with discount (no linked outbound visible)
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('price')}</span>
                      <div className="text-right">
                        {/* Original price with strikethrough */}
                        <span className="text-muted-foreground line-through text-lg mr-2">
                          {priceDisplay}
                        </span>
                        {/* Discounted price - 30% off */}
                        <span className="font-bold text-green-600 dark:text-green-400 text-2xl">
                          {formatPrice(Math.round(reservation.price * 0.7), reservation.price_currency)}
                        </span>
                        {/* Discount badge */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Tag className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            30% {t('discount') || 'discount'} ({reservation.promo_code})
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Regular price display without discount
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('price')}</span>
                    <span className="font-bold text-primary text-2xl">{priceDisplay}</span>
                  </div>
                )}
                
                {/* Payment Status Indicator */}
                {reservation.payment_type === 'payment_link' && (
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Payment Status</span>
                      </div>
                      {reservation.payment_status === 'paid' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Payment Received
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock3 className="h-3 w-3 mr-1" />
                          Payment Pending
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show Pay Now button if payment is pending and link exists */}
                    {reservation.payment_status !== 'paid' && reservation.payment_link && (
                      <div className="mt-3">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            const link = reservation.payment_link;
                            if (link) {
                              // Ensure proper URL format
                              const url = link.startsWith('http://') || link.startsWith('https://') 
                                ? link 
                                : `https://${link}`;
                              // Use window.location for maximum compatibility on mobile browsers
                              window.location.href = url;
                            }
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t('payNow')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Cash payment indicator */}
                {reservation.payment_type === 'cash' && (
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('paymentMethod')}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Banknote className="h-3 w-3 mr-1" />
                        {t('cashToDriver')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yolcudan Alınacak Nakit - bağımsız section */}
            {reservation.passenger_cash_amount && reservation.passenger_cash_amount > 0 && !['awaiting-price', 'waiting_for_customer_approval'].includes(reservation.status) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">Cash Payment to Driver</span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-2xl">
                    {getCurrencySymbol(reservation.passenger_cash_currency)}{reservation.passenger_cash_amount}
                  </span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Please pay this amount in cash to your driver at the end of the transfer.
                </p>
              </div>
            )}

            {/* Pending Price Message */}
            {reservation.status === 'awaiting-price' && (
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
                <p className="text-orange-700 dark:text-orange-300">
                  {t('ourTeamReviewing')}
                </p>
              </div>
            )}

            {/* Customer Approval Section */}
            {reservation.status === 'waiting_for_customer_approval' && (
              <div className="space-y-4">
                {/* Discounted Offer Badge */}
                {isDiscountedOffer && (
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 justify-center">
                      <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {t('specialDiscountApplied') || 'İndirimli fiyat uygulandı!'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg text-center">
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
                    {t('priceReady')}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400">
                    {t('reviewPriceMessage')}
                  </p>
                </div>
                
                {/* Show both buttons if can reject, only Accept button otherwise */}
                {canReject ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={handleRejectPrice} 
                        variant="outline" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t('reject')}
                      </Button>
                      <Button 
                        onClick={handleAcceptPrice}
                        disabled={actionLoading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {t('accept')}
                      </Button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      {t('rejectExplanation') || 'Bu Fiyatları Beğenmediyseniz Reject Tuşuna Basarak iletin.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleAcceptPrice}
                      disabled={actionLoading}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      {t('accept')}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      {t('finalOfferMessage') || 'Bu sizin için özel indirimli son teklifimizdir.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Driver Info - Premium Enhanced Card */}
            {reservation.drivers ? (
              <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-xl"
              >
                {/* Premium Header */}
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-5 py-4 border-b border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center ring-2 ring-primary/20"
                      >
                        <Car className="h-5 w-5 text-primary" />
                      </motion.div>
                      <div>
                        <span className="font-bold text-lg text-primary">{t('driverInformation')}</span>
                        <p className="text-xs text-muted-foreground">{language === 'TR' ? 'Şoförünüz hazır' : 'Your driver is ready'}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'TR' ? 'Atandı' : 'Assigned'}
                    </Badge>
                  </div>
                </div>
                
                {/* Driver Content */}
                <div className="p-5 space-y-5">
                  {/* Driver Avatar & Name */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-4 ring-primary/20 shadow-lg">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                        {language === 'TR' ? 'Şoförünüz' : 'Your Driver'}
                      </div>
                      <div className="text-xl font-bold text-foreground">{reservation.drivers.name}</div>
                    </div>
                  </div>
                  
                  {/* Vehicle Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Plate Number */}
                    {reservation.drivers.plate_number && (
                      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-xs text-muted-foreground">{language === 'TR' ? 'Plaka' : 'Plate'}</span>
                        </div>
                        <div className="font-mono font-bold text-base bg-primary/10 px-2 py-1 rounded inline-block">
                          {reservation.drivers.plate_number}
                        </div>
                      </div>
                    )}
                    
                    {/* Color */}
                    {reservation.drivers.vehicle_color && (
                      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-xs text-muted-foreground">{language === 'TR' ? 'Renk' : 'Color'}</span>
                        </div>
                        <div className="font-semibold text-base">{reservation.drivers.vehicle_color}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Model - Full Width */}
                  {reservation.drivers.vehicle_model && (
                    <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/10 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Car className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">{language === 'TR' ? 'Araç' : 'Vehicle'}</span>
                      </div>
                      <div className="font-semibold text-base">{reservation.drivers.vehicle_model}</div>
                    </div>
                  )}
                  
                  {/* WhatsApp Support Button */}
                  <Button
                    onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
                    className="w-full h-12 bg-[#25D366] hover:bg-[#22c55e] text-white font-semibold shadow-lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {language === 'TR' ? 'WhatsApp Destek' : 'WhatsApp Support'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                variants={itemVariants}
                className="bg-muted/30 border-2 border-dashed border-primary/20 p-6 rounded-2xl text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Car className="h-8 w-8 text-primary/50" />
                </motion.div>
                <p className="text-muted-foreground font-medium mb-1">
                  {language === 'TR' ? 'Şoför Atanacak' : 'Driver Will Be Assigned'}
                </p>
                <p className="text-sm text-muted-foreground/70">{t('driverAssignedSoonMessage')}</p>
              </motion.div>
            )}

            {/* Confirmed Message */}
            {reservation.status === 'customer_approved' && !reservation.drivers && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  {t('bookingConfirmed')}
                </p>
              </div>
            )}

            {/* Completed Message & Review Prompt */}
            {reservation.status === 'completed' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                  <p className="text-green-700 dark:text-green-300">
                    {t('thankYouMessage')}
                  </p>
                </div>
                
                {/* Review Prompt - only show if driver exists and no review yet */}
                {reservation.drivers && !hasReview && (
                  <ReviewPromptBanner
                    reservationId={reservation.id}
                    reservationCode={reservation.reservation_code || ''}
                    driverName={reservation.drivers.name}
                  />
                )}
                
                {/* Already reviewed message */}
                {hasReview && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-accent">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">
                        {language === 'TR' ? 'Değerlendirmeniz için teşekkürler!' : 'Thank you for your review!'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Message */}
            {(reservation.status === 'customer_rejected' || reservation.status === 'cancelled_by_customer') && (
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <p className="text-destructive">
                  {t('reservationCancelledMessage')}
                </p>
              </div>
            )}

            {/* Pending Admin Review Message */}
            {reservation.status === 'pending_admin_review' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 mx-auto text-amber-600 mb-2" />
                <p className="text-amber-700 dark:text-amber-300">
                  {t('changesUnderReview')}
                </p>
              </div>
            )}

            {/* Missing Information Alerts */}
            {['customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review'].includes(reservation.status) && (
              <MissingInfoAlerts reservation={reservation} onEdit={() => navigate(`/customer/reservation/${reservation.id}/edit`)} />
            )}

            {/* Action Buttons for confirmed reservations */}
            {(canEdit || canCancel) && (
              <div className="space-y-3 pt-4 border-t">
                {canEdit && (
                  <Button 
                    onClick={() => navigate(`/customer/reservation/${reservation.id}/edit`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('editReservation') || 'Edit Reservation'}
                  </Button>
                )}
                
                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-destructive/10"
                        disabled={cancelLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('cancelReservation') || 'Cancel Reservation'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('cancelReservationTitle') || 'Cancel Reservation?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('cancelReservationDescription') || 'Are you sure you want to cancel this reservation? This action cannot be undone.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('keepReservation') || 'Keep Reservation'}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelReservation}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('yesCancelIt') || 'Yes, Cancel It'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {/* Cannot cancel warning - less than 24 hours */}
            {!canCancel && !isPickupDatePast() && reservation && 
              ['customer_approved', 'confirmed', 'sent_to_driver', 'waiting_for_customer_approval'].includes(reservation.status) && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">
                      {t('cannotCancelTitle') || 'Cancellation Not Available'}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      {t('cannotCancelMessage') || `Reservations can only be cancelled at least 24 hours before pickup. Your pickup is in ${hoursUntilPickup()} hours. Please contact us via WhatsApp for assistance.`}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 border-amber-500 text-amber-700 hover:bg-amber-100"
                      onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('contactWhatsApp') || 'Contact via WhatsApp'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default CustomerReservationDetail;