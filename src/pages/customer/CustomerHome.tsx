import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromo, getLocalizedDiscountText } from '@/contexts/PromoContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  LogOut, Plane, MapPin, Calendar, User, Phone, Car, CreditCard, Users, 
  Trash2, UserPlus, Shield, Bell, Settings, Plus, ClipboardList, 
  ChevronRight, Edit2, Save, X, MessageCircle, PhoneCall, Sparkles, 
  Clock, Star, ArrowRight, Loader2, Home, RefreshCw, Globe, History,
  Bookmark, TrendingUp, Briefcase, Baby, MessageSquare, CheckCircle,
  Snowflake, Armchair, Wifi, BatteryCharging, Droplets, Stars, Wine, Crown, Tv,
  Award, Zap, Tag, Heart, HeartOff, Route
} from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/NotificationBell';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { GoogleRouteMap } from '@/components/ui/google-route-map';
import { PhoneInput } from '@/components/ui/phone-input';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { VEHICLE_TYPE_OPTIONS as vehicleTypes, getAvailableVehicles, isMinibusRequired, VEHICLE_TYPE_MAP } from '@/lib/vehicleTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Language } from '@/contexts/LanguageContext';
import meetTransferLogo from '@/assets/meet-transfer-logo.webp';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/agency/PullToRefreshIndicator';
import { WHATSAPP_NUMBER, EMERGENCY_PHONE } from '@/lib/contact';
import UniversalLanguageSelector from '@/components/UniversalLanguageSelector';
import { PendingBookingStorage } from '@/hooks/usePendingBookingStorage';

// Validation schema - memoized outside component
const reservationSchema = z.object({
  pickup: z.string().trim().min(2, "Pick-up point must be at least 2 characters").max(200, "Pick-up point is too long"),
  dropoff: z.string().trim().min(2, "Drop-off location must be at least 2 characters").max(200, "Drop-off location is too long"),
  date: z.string().min(1, "Please select a pickup date"),
  time: z.string().min(1, "Please select a pickup time"),
  flightNumber: z.string().trim().max(20, "Flight number is too long").optional().or(z.literal('')),
  passengerPhone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20, "Phone number is too long").regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  paymentType: z.string().min(1, "Please select a payment type"),
});

const MAX_PASSENGERS = 15;

// Feature icon helper - matches Hero.tsx
const getFeatureIconWithColor = (iconName: string) => {
  const iconConfig: Record<string, { icon: typeof Snowflake; color: string }> = {
    'snowflake': { icon: Snowflake, color: 'text-sky-500' },
    'armchair': { icon: Armchair, color: 'text-amber-600' },
    'wifi': { icon: Wifi, color: 'text-blue-500' },
    'battery-charging': { icon: BatteryCharging, color: 'text-green-500' },
    'droplets': { icon: Droplets, color: 'text-cyan-500' },
    'luggage': { icon: Briefcase, color: 'text-orange-500' },
    'stars': { icon: Stars, color: 'text-yellow-500' },
    'wine': { icon: Wine, color: 'text-rose-500' },
    'sparkles': { icon: Sparkles, color: 'text-purple-500' },
    'crown': { icon: Crown, color: 'text-yellow-600' },
    'tv': { icon: Tv, color: 'text-indigo-500' },
    'champagne': { icon: Wine, color: 'text-pink-500' },
  };
  return iconConfig[iconName] || { icon: Sparkles, color: 'text-purple-500' };
};

// Helper function - outside component for better performance
const getGreeting = (t: (key: string) => string): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 18) return t('goodAfternoon');
  return t('goodEvening');
};

const CustomerHome = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { promoCode: activePromo } = usePromo();
  const navigate = useNavigate();
  
  // State - organized by purpose
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPricePreparation, setShowPricePreparation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [recentReservations, setRecentReservations] = useState<Array<{
    id: string;
    reservation_code: string | null;
    pickup: string;
    dropoff: string;
    pickup_place_name: string | null;
    dropoff_place_name: string | null;
    pickup_date: string;
    pickup_time: string;
    status: string;
    vehicle_type: string;
  }>>([]);
  const [completedReservations, setCompletedReservations] = useState<Array<{
    id: string;
    reservation_code: string | null;
    pickup: string;
    dropoff: string;
    pickup_place_name: string | null;
    dropoff_place_name: string | null;
    pickup_date: string;
    pickup_time: string;
    status: string;
    vehicle_type: string;
    driver_id: string | null;
    drivers: { name: string } | null;
    hasReview?: boolean;
  }>>([]);
  const [nextTransfer, setNextTransfer] = useState<{date: string; time: string; pickup: string; dropoff: string; reservationCode?: string} | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', phone: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{pickup: string; dropoff: string}[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<Array<{
    id: string;
    name: string;
    pickup_location: string;
    dropoff_location: string;
    notes: string | null;
    usage_count: number;
  }>>([]);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [newFavoriteRoute, setNewFavoriteRoute] = useState({ name: '', pickup: '', dropoff: '', notes: '' });
  
  // Pending booking modal state
  const [showPendingBookingModal, setShowPendingBookingModal] = useState(false);
  const [pendingBookingInfo, setPendingBookingInfo] = useState<{
    token: string;
    bookingData: any;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  } | null>(null);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    passengerPhone: '',
    vehicleType: 'mercedes-vito',
    paymentType: 'cash',
    luggageCount: '1',
    babySeatCount: '0',
    customerNotes: '',
  });

  // Price fetching state
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, number>>({});
  const [priceCurrency, setPriceCurrency] = useState<string>('EUR');
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState<string | null>(null);

  // Computed: available vehicles based on passengers and luggage
  const passengerNum = passengerNames.filter(n => n.trim()).length || 1;
  const luggageNum = parseInt(formData.luggageCount) || 1;
  const availableVehicles = getAvailableVehicles(passengerNum, luggageNum);
  const minibusRequired = isMinibusRequired(passengerNum, luggageNum);
  const currentVehicle = VEHICLE_TYPE_MAP[formData.vehicleType];

  // Auto-select minibus if required
  useEffect(() => {
    if (minibusRequired && formData.vehicleType !== 'minibus') {
      setFormData(prev => ({ ...prev, vehicleType: 'minibus' }));
    }
  }, [minibusRequired, formData.vehicleType]);

  // Get currency based on language
  const getCurrencyByLanguage = useCallback(() => {
    switch (language) {
      case 'TR': return 'TRY';
      case 'AR': return 'AED';
      case 'DE': return 'EUR';
      default: return 'EUR';
    }
  }, [language]);

  // Fetch prices when pickup and dropoff are filled
  useEffect(() => {
    const fetchVehiclePrices = async () => {
      if (!formData.pickup || !formData.dropoff) {
        setVehiclePrices({});
        setPricesError(null);
        return;
      }

      // Minimum length check
      if (formData.pickup.length < 3 || formData.dropoff.length < 3) {
        return;
      }

      setIsPricesLoading(true);
      setPricesError(null);

      try {
        const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: {
            pickup: formData.pickup,
            dropoff: formData.dropoff,
            customerCurrency: getCurrencyByLanguage(),
          },
        });

        if (error) throw error;

        if (data?.prices && data.prices.length > 0) {
          const pricesMap: Record<string, number> = {};
          data.prices.forEach((p: any) => {
            if (p.price) {
              pricesMap[p.vehicleType] = p.price;
            }
          });
          setVehiclePrices(pricesMap);
          setPriceCurrency(data.currency || getCurrencyByLanguage());
        } else {
          setVehiclePrices({});
          setPricesError(t('noPriceFound') || 'Bu güzergah için fiyat bulunamadı');
        }
      } catch (error) {
        console.error("Error fetching vehicle prices:", error);
        setVehiclePrices({});
        setPricesError(t('priceError') || 'Fiyat alınırken hata oluştu');
      } finally {
        setIsPricesLoading(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchVehiclePrices, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.pickup, formData.dropoff, getCurrencyByLanguage, t]);

  // Memoized greeting
  const greeting = useMemo(() => getGreeting(t), [t]);

  // Memoized display name
  const displayName = useMemo(() => {
    return profileData.full_name || user?.email?.split('@')[0] || t('valuedCustomer');
  }, [profileData.full_name, user?.email, t]);

  // Track if profile phone has been auto-filled to prevent loops
  const [hasAutoFilledPhone, setHasAutoFilledPhone] = useState(false);

  // Fetch data function - extracted for refresh capability
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      // Fetch active bookings with next transfer info
      const { data: activeReservations, count } = await supabase
        .from('reservations')
        .select('id, reservation_code, pickup, dropoff, pickup_place_name, dropoff_place_name, pickup_date, pickup_time, status, vehicle_type', { count: 'exact' })
        .eq('customer_id', user.id)
        .in('status', ['awaiting-price', 'waiting_for_customer_approval', 'customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review'])
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .limit(5);
      
      setActiveBookingsCount(count || 0);
      setRecentReservations(activeReservations || []);
      
      // Set next upcoming transfer
      if (activeReservations && activeReservations.length > 0) {
        const next = activeReservations[0];
        setNextTransfer({
          date: next.pickup_date,
          time: next.pickup_time,
          pickup: next.pickup_place_name || next.pickup,
          dropoff: next.dropoff_place_name || next.dropoff,
          reservationCode: next.reservation_code || undefined
        });
      } else {
        setNextTransfer(null);
      }

      // Fetch completed reservations with driver info
      const { data: pastReservations } = await supabase
        .from('reservations')
        .select('id, reservation_code, pickup, dropoff, pickup_place_name, dropoff_place_name, pickup_date, pickup_time, status, vehicle_type, driver_id, drivers:driver_id(name)')
        .eq('customer_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('pickup_date', { ascending: false })
        .order('pickup_time', { ascending: false })
        .limit(5);
      
      // Check for existing reviews for completed reservations
      if (pastReservations && pastReservations.length > 0) {
        const completedIds = pastReservations
          .filter(r => r.status === 'completed' && r.driver_id)
          .map(r => r.id);
        
        if (completedIds.length > 0) {
          const { data: existingReviews } = await supabase
            .from('driver_reviews')
            .select('reservation_id')
            .in('reservation_id', completedIds);
          
          const reviewedIds = new Set(existingReviews?.map(r => r.reservation_id) || []);
          
          setCompletedReservations(pastReservations.map(r => ({
            ...r,
            hasReview: reviewedIds.has(r.id)
          })));
        } else {
          setCompletedReservations(pastReservations.map(r => ({ ...r, hasReview: false })));
        }
      } else {
        setCompletedReservations([]);
      }

      // Fetch favorite routes
      const { data: favorites } = await supabase
        .from('favorite_routes')
        .select('id, name, pickup_location, dropoff_location, notes, usage_count')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(10);
      
      setFavoriteRoutes(favorites || []);

      // Load recent searches from localStorage
      const savedSearches = localStorage.getItem(`recentSearches_${user.id}`);
      if (savedSearches) {
        try {
          setRecentSearches(JSON.parse(savedSearches).slice(0, 3));
        } catch {}
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          phone: profile.phone || ''
        });
        // Auto-fill phone only once if empty and not already auto-filled
        if (!hasAutoFilledPhone && profile.phone) {
          setFormData(prev => {
            if (!prev.passengerPhone) {
              return { ...prev, passengerPhone: profile.phone || '' };
            }
            return prev;
          });
          setHasAutoFilledPhone(true);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [user?.id, hasAutoFilledPhone]);

  // Pull to refresh handler
  const handlePullToRefresh = useCallback(async () => {
    await fetchData();
    toast.success(t('refreshedMsg'));
  }, [fetchData, t]);

  const { pullDistance, isRefreshing: isPullRefreshing, isPulling, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullToRefresh,
    threshold: 80,
  });

  // Check for pending booking token from AI assistant (after Google login)
  useEffect(() => {
    const checkPendingBooking = async () => {
      if (!user?.id) return;
      
      // Check sessionStorage via PendingBookingStorage first (Google OAuth flow)
      const sessionBookingData = PendingBookingStorage.load();
      
      // Also check legacy localStorage
      const pendingToken = localStorage.getItem('pending_booking_token');
      const pendingData = localStorage.getItem('pending_booking_data');
      
      // If we have session booking data from Google OAuth, AUTO-CREATE reservation
      if (sessionBookingData && sessionBookingData.pickup && sessionBookingData.dropoff) {
        console.log('[CustomerHome] Found pending booking from sessionStorage, creating reservation...', sessionBookingData);
        
        // Clear the pending booking data immediately to prevent duplicate processing
        PendingBookingStorage.clear();
        
        setIsCreatingReservation(true);
        
        try {
          // Get user profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();
          
          const customerName = sessionBookingData.customerName || profile?.full_name || user.user_metadata?.full_name || 'Customer';
          const customerPhone = sessionBookingData.customerPhone || profile?.phone || '';
          const customerEmail = user.email || '';
          
          // Determine initial status based on whether we have a price
          const hasPrice = sessionBookingData.estimatedPrice && sessionBookingData.estimatedPrice > 0;
          const initialStatus = hasPrice ? 'confirmed' : 'awaiting-price';
          
          // Build passenger names array
          let passengerNamesArray = sessionBookingData.passengerNames;
          if (!passengerNamesArray || passengerNamesArray.length === 0) {
            passengerNamesArray = [customerName];
          }
          
          // Create main reservation directly
          const reservationData = {
            customer_id: user.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            pickup: sessionBookingData.pickup!,
            dropoff: sessionBookingData.dropoff!,
            pickup_date: sessionBookingData.date || new Date().toISOString().split('T')[0],
            pickup_time: sessionBookingData.time || '10:00',
            vehicle_type: sessionBookingData.vehicleType || 'Mercedes Vito',
            passengers: sessionBookingData.passengers || 1,
            price: sessionBookingData.estimatedPrice || null,
            price_currency: sessionBookingData.currency || 'EUR',
            status: initialStatus,
            payment_method: sessionBookingData.paymentMethod || 'cash',
            payment_type: sessionBookingData.paymentMethod || 'cash',
            luggage_count: sessionBookingData.luggageCount || 1,
            baby_seat_count: sessionBookingData.babySeatCount || 0,
            customer_notes: sessionBookingData.customerNotes || null,
            flight_number: sessionBookingData.flightNumber || null,
            passenger_names: passengerNamesArray,
            promo_code: sessionBookingData.promoCode || null,
          };
          
          const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .insert([reservationData])
            .select()
            .single();
          
          if (reservationError) {
            console.error('[CustomerHome] Failed to create reservation:', reservationError);
            toast.error(language === 'TR' 
              ? 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.'
              : 'Failed to create reservation. Please try again.');
            setIsCreatingReservation(false);
            return;
          }
          
          console.log('[CustomerHome] Reservation created successfully:', reservation?.reservation_code);
          
          // Create return trip if requested
          if (sessionBookingData.hasReturnTrip && sessionBookingData.returnDate && sessionBookingData.returnTime) {
            const returnData = {
              customer_id: user.id,
              customer_name: customerName,
              customer_phone: customerPhone,
              pickup: sessionBookingData.dropoff!, // Swap
              dropoff: sessionBookingData.pickup!, // Swap
              pickup_date: sessionBookingData.returnDate,
              pickup_time: sessionBookingData.returnTime,
              vehicle_type: sessionBookingData.vehicleType || 'Mercedes Vito',
              passengers: sessionBookingData.passengers || 1,
              price: sessionBookingData.returnPrice || sessionBookingData.estimatedPrice || null,
              price_currency: sessionBookingData.currency || 'EUR',
              status: initialStatus,
              payment_method: sessionBookingData.paymentMethod || 'cash',
              payment_type: sessionBookingData.paymentMethod || 'cash',
              luggage_count: sessionBookingData.luggageCount || 1,
              baby_seat_count: sessionBookingData.babySeatCount || 0,
              customer_notes: sessionBookingData.customerNotes || null,
              passenger_names: passengerNamesArray,
              promo_code: sessionBookingData.promoCode || null,
              is_return_trip: true,
              original_reservation_id: reservation?.id,
            };
            
            const { error: returnError } = await supabase
              .from('reservations')
              .insert([returnData]);
            
            if (returnError) {
              console.error('[CustomerHome] Failed to create return reservation:', returnError);
            } else {
              console.log('[CustomerHome] Return reservation created successfully');
            }
          }
          
          toast.success(language === 'TR' 
            ? `Rezervasyonunuz oluşturuldu! Kod: ${reservation?.reservation_code}`
            : `Your reservation has been created! Code: ${reservation?.reservation_code}`);
          
          // Refresh data to show the new reservation
          fetchData();
          
        } catch (err) {
          console.error('[CustomerHome] Error creating reservation from sessionStorage:', err);
          toast.error(language === 'TR' 
            ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
            : 'An error occurred. Please try again.');
        } finally {
          setIsCreatingReservation(false);
        }
        
        return;
      }
      
      if (!pendingToken && !pendingData) return;
      
      console.log('Found pending booking, processing...', { pendingToken, pendingData });
      
      try {
        let quickBooking: any = null;
        let bookingDataFromStorage: any = null;
        
        // Handle token-based pending booking via secure edge function
        if (pendingToken) {
          localStorage.removeItem('pending_booking_token');
          
          // Use edge function to fetch booking securely (RLS prevents direct access)
          const { data: result, error } = await supabase.functions.invoke('get-quick-booking-by-token', {
            body: { token: pendingToken }
          });
          
          if (error || !result?.success || !result?.data) {
            console.error('Failed to load pending booking:', error || result?.error);
            return;
          }
          quickBooking = result.data;
        }
        
        // Handle data-based pending booking
        if (pendingData) {
          localStorage.removeItem('pending_booking_data');
          try {
            bookingDataFromStorage = JSON.parse(pendingData);
          } catch (e) {
            console.error('Failed to parse pending booking data:', e);
          }
        }
        
        // Get user profile for phone
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        
        // Get user email from auth
        const userEmail = user.email || quickBooking?.customer_email || '';
        const userName = profile?.full_name || user.user_metadata?.full_name || quickBooking?.customer_name || '';
        const userPhone = profile?.phone || quickBooking?.customer_phone || '';
        
        // Check if we have missing required info
        const hasMissingInfo = !userName.trim() || !userPhone.trim();
        
        if (hasMissingInfo && quickBooking) {
          // Show modal to collect missing info
          console.log('Missing info detected, showing modal...');
          setPendingBookingInfo({
            token: pendingToken || '',
            bookingData: quickBooking,
            customerName: userName,
            customerPhone: userPhone,
            customerEmail: userEmail,
          });
          setShowPendingBookingModal(true);
          return;
        }
        
        // If we have all info, proceed with reservation creation
        if (quickBooking) {
          setIsCreatingReservation(true);
          const { data: result, error: createError } = await supabase.functions.invoke('create-quick-booking-reservation', {
            body: {
              bookingId: quickBooking.id,
              customerName: userName,
              customerEmail: userEmail,
              customerPhone: userPhone,
              paymentMethod: quickBooking.payment_method || 'card',
              hasReturnTrip: quickBooking.has_return_trip,
              returnDate: quickBooking.return_date,
              returnTime: quickBooking.return_time,
              returnPrice: quickBooking.return_price,
            }
          });
          setIsCreatingReservation(false);
          
          if (createError) {
            console.error('Failed to create reservation:', createError);
            toast.error(t('reservationCreateFailed'));
            return;
          }
          
          console.log('Reservation created from pending booking:', result);
          toast.success(t('reservationCreatedSuccess'));
          
          // Refresh data to show the new reservation
          fetchData();
        }
        
      } catch (err) {
        console.error('Error processing pending booking:', err);
        setIsCreatingReservation(false);
      }
    };
    
    if (!authLoading && user?.id) {
      checkPendingBooking();
    }
  }, [authLoading, user?.id, user?.email, user?.user_metadata, language, fetchData]);
  
  // Handle completing pending booking from modal
  const handleCompletePendingBooking = async () => {
    if (!pendingBookingInfo || !user?.id) return;
    
    const { bookingData, customerName, customerPhone, customerEmail } = pendingBookingInfo;
    
    // Validate
    if (!customerName.trim()) {
      toast.error(t('pleaseEnterName'));
      return;
    }
    if (!customerPhone.trim()) {
      toast.error(t('pleaseEnterPhone'));
      return;
    }
    
    setIsCreatingReservation(true);
    
    try {
      // First update the profile
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        updated_at: new Date().toISOString()
      });
      
      // Create reservation
      const { data: result, error: createError } = await supabase.functions.invoke('create-quick-booking-reservation', {
        body: {
          bookingId: bookingData.id,
          customerName: customerName.trim(),
          customerEmail: customerEmail,
          customerPhone: customerPhone.trim(),
          paymentMethod: bookingData.payment_method || 'card',
          hasReturnTrip: bookingData.has_return_trip,
          returnDate: bookingData.return_date,
          returnTime: bookingData.return_time,
          returnPrice: bookingData.return_price,
        }
      });
      
      if (createError) {
        console.error('Failed to create reservation:', createError);
        toast.error(t('reservationCreateFailed'));
        return;
      }
      
      console.log('Reservation created from modal:', result);
      toast.success(t('reservationCreatedSuccess'));
      
      // Close modal and refresh
      setShowPendingBookingModal(false);
      setPendingBookingInfo(null);
      setProfileData({ full_name: customerName.trim(), phone: customerPhone.trim() });
      fetchData();
      
    } catch (err) {
      console.error('Error completing pending booking:', err);
      toast.error(t('errorOccurred'));
    } finally {
      setIsCreatingReservation(false);
    }
  };

  // Wait for auth to complete before fetching data
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchData();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user?.id, fetchData]);

  // Real-time subscription for customer's reservations
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime subscription for customer:', user.id);

    const channel = supabase
      .channel('customer-home-reservations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('CustomerHome - Reservation realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast.success(t('newReservationCreated'));
            fetchData();
          } else if (payload.eventType === 'UPDATE') {
            toast.info(t('reservationUpdated'));
            fetchData();
          } else if (payload.eventType === 'DELETE') {
            toast.info(t('reservationDeleted'));
            fetchData();
          }
        }
      )
      .subscribe((status) => {
        console.log('CustomerHome realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up CustomerHome realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, language, fetchData]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name.trim(),
          phone: profileData.phone.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(t('profileUpdatedMsg'));
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Favorite routes functions
  const handleAddFavoriteRoute = async () => {
    if (!user?.id) return;
    if (!newFavoriteRoute.name.trim() || !newFavoriteRoute.pickup.trim() || !newFavoriteRoute.dropoff.trim()) {
      toast.error(t('fillAllFieldsMsg'));
      return;
    }

    try {
      const { error } = await supabase
        .from('favorite_routes')
        .insert({
          user_id: user.id,
          name: newFavoriteRoute.name.trim(),
          pickup_location: newFavoriteRoute.pickup.trim(),
          dropoff_location: newFavoriteRoute.dropoff.trim(),
          notes: newFavoriteRoute.notes.trim() || null,
        });

      if (error) throw error;

      toast.success(t('favoriteRouteAddedMsg'));
      setNewFavoriteRoute({ name: '', pickup: '', dropoff: '', notes: '' });
      setIsAddingFavorite(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add favorite route');
    }
  };

  const handleDeleteFavoriteRoute = async (routeId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('favorite_routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('favoriteRouteDeletedMsg'));
      setFavoriteRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete route');
    }
  };

  const handleUseFavoriteRoute = async (route: typeof favoriteRoutes[0]) => {
    // Update usage count
    if (user?.id) {
      supabase
        .from('favorite_routes')
        .update({ usage_count: route.usage_count + 1 })
        .eq('id', route.id)
        .then(() => {});
    }

    // Fill form with favorite route
    setFormData(prev => ({
      ...prev,
      pickup: route.pickup_location,
      dropoff: route.dropoff_location,
      customerNotes: route.notes || '',
    }));
    setIsBookingFormOpen(true);
    setTimeout(() => {
      const formElement = document.getElementById('booking-form');
      formElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSaveCurrentRouteAsFavorite = () => {
    if (!formData.pickup || !formData.dropoff) {
      toast.error(t('enterLocationsFirstMsg'));
      return;
    }
    setNewFavoriteRoute({
      name: '',
      pickup: formData.pickup,
      dropoff: formData.dropoff,
      notes: formData.customerNotes || '',
    });
    setIsAddingFavorite(true);
  };

  const addPassenger = () => {
    if (passengerNames.length < MAX_PASSENGERS) {
      setPassengerNames([...passengerNames, '']);
    }
  };

  const removePassenger = (index: number) => {
    if (passengerNames.length > 1) {
      setPassengerNames(passengerNames.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, value: string) => {
    const updated = [...passengerNames];
    updated[index] = value;
    setPassengerNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      setErrors({ passengerNames: t('passengerRequired') });
      toast.error(t('passengerRequired'));
      setIsLoading(false);
      return;
    }

    const result = reservationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(t('fixValidationErrors'));
      setIsLoading(false);
      return;
    }

    // Save to recent searches
    if (user?.id) {
      const newSearch = { pickup: result.data.pickup, dropoff: result.data.dropoff.trim() };
      const existingSearches = recentSearches.filter(
        s => s.pickup !== newSearch.pickup || s.dropoff !== newSearch.dropoff
      );
      const updatedSearches = [newSearch, ...existingSearches].slice(0, 3);
      setRecentSearches(updatedSearches);
      localStorage.setItem(`recentSearches_${user.id}`, JSON.stringify(updatedSearches));
    }

    // Close the booking form and show price preparation animation
    setIsBookingFormOpen(false);
    setShowPricePreparation(true);

    // Store passenger names in sessionStorage for the reservation form to pick up
    sessionStorage.setItem('customerPassengerNames', JSON.stringify(validPassengerNames));
    sessionStorage.setItem('customerPhone', result.data.passengerPhone.trim());

    // Fetch prices DURING the animation (not after navigation)
    try {
      const { data } = await supabase.functions.invoke("get-all-vehicle-prices", {
        body: {
          pickup: result.data.pickup,
          dropoff: result.data.dropoff.trim(),
          customerCurrency: 'EUR',
        },
      });

      // Build URL params with all form data
      const params = new URLSearchParams({
        pickup: result.data.pickup,
        dropoff: result.data.dropoff.trim(),
        date: result.data.date,
        time: result.data.time,
        vehicleType: result.data.vehicleType,
        passengers: String(validPassengerNames.length),
        paymentMethod: result.data.paymentType,
        luggageCount: formData.luggageCount,
        babySeatCount: formData.babySeatCount,
        pricesPreFetched: 'true', // Flag to skip price animation on ReservationForm
      });
      
      if (result.data.flightNumber) {
        params.set('flightNumber', result.data.flightNumber.trim());
      }
      
      if (formData.customerNotes.trim()) {
        params.set('customerNotes', formData.customerNotes.trim());
      }

      // Add pre-fetched vehicle prices to URL
      if (data?.prices && data.prices.length > 0) {
        const pricesMap: Record<string, number> = {};
        data.prices.forEach((p: any) => {
          if (p.price) {
            pricesMap[p.vehicleType] = p.price;
          }
        });
        params.set('allVehiclePrices', encodeURIComponent(JSON.stringify(pricesMap)));
        // Store full price data for vehicle selection
        sessionStorage.setItem('preFetchedVehiclePrices', JSON.stringify(data.prices));
      }

      // Minimum 2.5 seconds for animation visibility
      await new Promise(resolve => setTimeout(resolve, 2500));

      navigate(`/book?${params.toString()}`);
    } catch (error) {
      console.error("Error fetching prices:", error);
      // Even if price fetch fails, proceed with navigation
      const params = new URLSearchParams({
        pickup: result.data.pickup,
        dropoff: result.data.dropoff.trim(),
        date: result.data.date,
        time: result.data.time,
        vehicleType: result.data.vehicleType,
        passengers: String(validPassengerNames.length),
        paymentMethod: result.data.paymentType,
        luggageCount: formData.luggageCount,
        babySeatCount: formData.babySeatCount,
      });
      
      if (result.data.flightNumber) {
        params.set('flightNumber', result.data.flightNumber.trim());
      }
      
      if (formData.customerNotes.trim()) {
        params.set('customerNotes', formData.customerNotes.trim());
      }
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      navigate(`/book?${params.toString()}`);
    }
  };

  // Price preparation animation screen
  if (showPricePreparation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full shadow-2xl border-primary/20">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              {/* Animated car icon with pulsing rings */}
              <div className="relative mb-8">
                <motion.div 
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Car className="h-12 w-12 text-white" />
                </motion.div>
                <motion.div 
                  className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-400/30"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-emerald-400/20"
                  animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </div>
              
              {/* Main title with gradient */}
              <motion.h1 
                className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {language === 'TR' ? 'Fiyatınız Hazırlanıyor' : 'Your Price is Being Prepared'}
              </motion.h1>
              
              {/* Animated subtitle */}
              <motion.p 
                className="text-muted-foreground mb-8 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {language === 'TR' 
                  ? 'En iyi fiyatı sizin için hesaplıyoruz...' 
                  : 'Calculating the best price for you...'}
              </motion.p>
              
              {/* Animated progress bar */}
              <div className="w-full max-w-xs mx-auto mb-8">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
              
              {/* Loading steps animation */}
              <div className="space-y-3 mb-6">
                <motion.div 
                  className="flex items-center justify-center gap-2 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-green-500" />
                  </motion.div>
                  <span className="text-muted-foreground">
                    {language === 'TR' ? 'Rotanız analiz ediliyor...' : 'Analyzing your route...'}
                  </span>
                </motion.div>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-emerald-500" />
                  </motion.div>
                  <span className="text-muted-foreground">
                    {language === 'TR' ? 'Araç seçenekleri kontrol ediliyor...' : 'Checking vehicle options...'}
                  </span>
                </motion.div>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-teal-500" />
                  </motion.div>
                  <span className="text-muted-foreground">
                    {language === 'TR' ? 'En iyi fiyat hesaplanıyor...' : 'Calculating best price...'}
                  </span>
                </motion.div>
              </div>
              
              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <motion.span 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <CheckCircle className="h-4 w-4" />
                  {language === 'TR' ? 'En İyi Fiyat Garantisi' : 'Best Price Guarantee'}
                </motion.span>
                <motion.span 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  <Sparkles className="h-4 w-4" />
                  {language === 'TR' ? 'Gizli Ücret Yok' : 'No Hidden Fees'}
                </motion.span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading screen while auth or data is loading
  if (authLoading || (isLoading && !recentReservations.length && !completedReservations.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
            />
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground text-sm">
            {language === 'TR' ? 'Yükleniyor...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header with Logo & Language - More compact on mobile */}
      <header className="bg-primary text-primary-foreground py-2 px-2 sm:py-4 sm:px-6 sticky top-0 z-10 safe-area-inset-top shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-primary-foreground/20"
            />
            <span className="text-base sm:text-xl font-serif font-bold">Meet Transfer</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2">
            {/* Language Selector in Header */}
            <UniversalLanguageSelector variant="header" />
            
            <NotificationBell />
          
          {/* Settings Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 sm:h-10 sm:w-10"
              >
                <Settings className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('settingsTitle')}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Profile Section - Premium Design */}
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(var(--primary),0.1),_transparent_50%)]" />
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <User className="h-6 w-6 text-primary" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {t('profileInfoTitle')}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('accountDetailsDesc')}
                          </p>
                        </div>
                      </div>
                      {!isEditingProfile ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingProfile(true)}
                          className="gap-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          {t('editBtn')}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEditingProfile(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="gap-1"
                          >
                            {isSavingProfile ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            {t('save')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4 pt-2">
                    {/* Name Field */}
                    <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t('fullNameLabel')}
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          placeholder={t('yourNamePlaceholder')}
                          className="mt-1 bg-background"
                        />
                      ) : (
                        <p className="text-base font-semibold mt-1 flex items-center gap-2">
                          {profileData.full_name || (
                            <span className="text-muted-foreground italic">
                              {t('notSpecified')}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {t('phoneLabel')}
                      </Label>
                      {isEditingProfile ? (
                        <PhoneInput
                          value={profileData.phone}
                          onChange={(value) => setProfileData({ ...profileData, phone: value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-base font-semibold mt-1">
                          {profileData.phone || (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                              {t('pleaseAdd')}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                      <p className="text-base font-semibold mt-1 flex items-center gap-2">
                        {user?.email}
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          {t('verified')}
                        </Badge>
                      </p>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {t('memberSince')}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Selector */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('languageLabel')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UniversalLanguageSelector variant="default" />
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <NotificationSettingsPanel language={language === 'TR' ? 'TR' : 'EN'} />

                {/* WhatsApp Support */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50"
                  onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(t('helloSupportMsg')), '_blank')}
                >
                  <span className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <MessageCircle className="h-4 w-4" />
                    {t('whatsAppSupport')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                </Button>

                {/* Emergency Call */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={() => window.open(`tel:${EMERGENCY_PHONE}`, '_self')}
                >
                  <span className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <PhoneCall className="h-4 w-4" />
                    {t('emergencyHotline')}
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 font-mono">{EMERGENCY_PHONE.replace('+90', '+90 ')}</span>
                </Button>

                {/* Edit Profile */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => navigate('/customer/profile')}
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('editProfile')}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Security Settings */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => navigate('/security-settings')}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('securitySettingsMenu')}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Logout */}
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logoutBtn')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>

      <main 
        className="container mx-auto py-4 px-3 sm:py-6 sm:px-4 max-w-4xl"
        {...pullHandlers}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isPullRefreshing}
          isPulling={isPulling}
          language={language === 'TR' ? 'TR' : 'EN'}
        />
        {/* Welcome Section */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="bg-primary/20 p-2.5 rounded-full"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {greeting}
                </p>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  {displayName}
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isRefreshing}
              className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* Dashboard Summary Cards */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-3 gap-2 sm:gap-3 mb-4"
        >
          {/* Active Reservations */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
            onClick={() => navigate('/customer/bookings')}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{activeBookingsCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t('activeCount')}</p>
            </CardContent>
          </Card>

          {/* Completed Transfers */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20"
            onClick={() => navigate('/customer/bookings#past-reservations')}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedReservations.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t('completedCount')}</p>
            </CardContent>
          </Card>

          {/* Favorite Routes */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20"
            onClick={() => {
              const favSection = document.getElementById('favorite-routes-section');
              favSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-accent">{favoriteRoutes.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t('favoritesCount') || t('favorites')}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Book Button */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <Button
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary text-lg font-semibold shadow-lg group"
            onClick={() => navigate('/')}
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            {t('bookNewTransfer') || 'Book New Transfer'}
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Missing Phone Warning */}
        {!profileData.phone && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 p-2 rounded-full flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {t('phoneNumberMissing')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {t('addPhoneNumberMsg')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={() => navigate('/customer/profile')}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    {t('addBtn')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Next Transfer Card with Animation */}
        <AnimatePresence>
          {nextTransfer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="mb-6 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-primary/30 cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 backdrop-blur-sm"
                onClick={() => navigate('/customer/bookings')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-sm font-medium text-primary">
                            {t('yourNextTransfer')}
                          </span>
                        </div>
                        {nextTransfer.reservationCode && (
                          <Badge variant="outline" className="font-mono text-xs bg-primary/10 border-primary/30">
                            {nextTransfer.reservationCode}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm sm:text-base">
                          {new Date(nextTransfer.date).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })} • {nextTransfer.time}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {nextTransfer.pickup.substring(0, 35)}{nextTransfer.pickup.length > 35 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Grid - More compact on mobile */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          {/* New Reservation Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative"
              onClick={() => {
                setIsBookingFormOpen(true);
                setTimeout(() => {
                  const formElement = document.getElementById('booking-form');
                  formElement?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
              <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center min-h-[90px] sm:min-h-[110px] relative z-10">
                <div className="bg-primary-foreground/20 rounded-full p-2 sm:p-2.5 mb-1.5 sm:mb-2 backdrop-blur-sm">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {t('newReservationBtn')}
                </span>
                <span className="text-[10px] sm:text-xs opacity-80 mt-0.5 sm:mt-1 hidden xs:block">
                  {t('startNowDesc')}
                </span>
              </CardContent>
            </Card>
          </motion.div>

          {/* My Bookings Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10"
          >
            <Card 
              className="cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-br from-background to-muted/50 border-2 border-transparent hover:border-primary/30 active:bg-muted/70"
              onClick={() => navigate('/customer/bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/customer/bookings')}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center min-h-[90px] sm:min-h-[110px] pointer-events-none">
                <div className="bg-primary/10 rounded-full p-2 sm:p-2.5 mb-1.5 sm:mb-2">
                  <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {t('myBookingsBtn')}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {activeBookingsCount > 0 
                    ? `${activeBookingsCount} ${t('activeLabel')}`
                    : t('viewAllLabel')}
                </span>
                {activeBookingsCount > 0 && (
                  <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-orange-500 hover:bg-orange-600 shadow-lg text-[10px] sm:text-xs px-1.5 sm:px-2 pointer-events-none">
                    {activeBookingsCount}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Support & Navigation Actions - More compact on mobile */}
        <motion.div 
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 sm:mb-6"
        >
          {/* Home */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-2 sm:py-3 w-full flex flex-col items-center gap-0.5 sm:gap-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-[10px] sm:text-xs font-medium">
                {t('homeBtn')}
              </span>
            </Button>
          </motion.div>
          
          {/* WhatsApp */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-2 sm:py-3 w-full flex flex-col items-center gap-0.5 sm:gap-1 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/40"
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(t('helloSupportMsg')), '_blank')}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">
                WhatsApp
              </span>
            </Button>
          </motion.div>
          
          {/* Emergency Call */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-2 sm:py-3 w-full flex flex-col items-center gap-0.5 sm:gap-1 bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 hover:border-red-500/40"
              onClick={() => window.open(`tel:${EMERGENCY_PHONE}`, '_self')}
            >
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">
                {t('emergencyBtn')}
              </span>
            </Button>
          </motion.div>
          
          {/* Security */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-2 sm:py-3 w-full flex flex-col items-center gap-0.5 sm:gap-1 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
              onClick={() => navigate('/security-settings')}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">
                {t('securityBtn')}
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Active Reservations Cards */}
        {recentReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                  {t('activeReservationsTitle')}
                </span>
              </div>
              {activeBookingsCount > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary/80"
                  onClick={() => navigate('/customer/bookings')}
                >
                  {t('viewAll')}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {recentReservations.slice(0, 3).map((reservation, index) => {
                const statusConfig: Record<string, { key: string; color: string; bgColor: string }> = {
                  'awaiting-price': { key: 'awaitingPrice', color: 'text-amber-700', bgColor: 'bg-amber-100' },
                  'waiting_for_customer_approval': { key: 'awaitingApproval', color: 'text-orange-700', bgColor: 'bg-orange-100' },
                  'customer_approved': { key: 'approved', color: 'text-blue-700', bgColor: 'bg-blue-100' },
                  'confirmed': { key: 'confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
                  'sent_to_driver': { key: 'driverAssigned', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
                  'pending_admin_review': { key: 'underReview', color: 'text-purple-700', bgColor: 'bg-purple-100' },
                };
                const status = statusConfig[reservation.status] || { key: reservation.status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
                
                const vehicleLabels: Record<string, string> = {
                  'mercedes-vito': 'Mercedes Vito',
                  'mercedes-vito-vip': 'Mercedes Vito VIP',
                  'mercedes-sprinter': 'Sprinter',
                  'minibus': 'Minibüs',
                  'maybach': 'Mercedes Maybach Minivan',
                };
                
                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className="cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/60 overflow-hidden"
                      onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header with code and status */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {reservation.reservation_code || 'N/A'}
                              </span>
                              <Badge className={cn("text-xs font-medium", status.bgColor, status.color)}>
                                {t(status.key)}
                              </Badge>
                            </div>
                            
                            {/* Route info */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                              <span className="truncate">
                                {(reservation.pickup_place_name || reservation.pickup).split(',')[0]}
                              </span>
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {(reservation.dropoff_place_name || reservation.dropoff).split(',')[0]}
                              </span>
                            </div>
                            
                            {/* Date, time and vehicle */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(reservation.pickup_date).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{reservation.pickup_time.slice(0, 5)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                <span>{vehicleLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                              </div>
                            </div>
                            
                            {/* Vehicle capacity and features */}
                            {(() => {
                              const vehicleInfo = VEHICLE_TYPE_MAP[reservation.vehicle_type];
                              if (!vehicleInfo) return null;
                              return (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 text-xs bg-muted/50 px-2 py-1 rounded">
                                    <Users className="h-3 w-3 text-primary" />
                                    <span>{vehicleInfo.passengers}</span>
                                    <Briefcase className="h-3 w-3 text-orange-500 ml-1" />
                                    <span>{vehicleInfo.luggage}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {vehicleInfo.features.slice(0, 3).map((feature, idx) => {
                                      const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                                      return (
                                        <div 
                                          key={idx} 
                                          className="bg-muted/50 p-1 rounded"
                                          title={language === 'TR' ? feature.labelTr : feature.label}
                                        >
                                          <FeatureIcon className={cn("h-3 w-3", color)} />
                                        </div>
                                      );
                                    })}
                                    {vehicleInfo.features.length > 3 && (
                                      <div className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">
                                        +{vehicleInfo.features.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Arrow indicator */}
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Completed Reservations History */}
        {completedReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            {/* Review Prompt Banner for unreviewed completed transfers */}
            {(() => {
              const unreviewedTransfer = completedReservations.find(
                r => r.status === 'completed' && r.driver_id && !r.hasReview
              );
              if (unreviewedTransfer && unreviewedTransfer.drivers) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-2 rounded-full shrink-0">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-accent fill-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm sm:text-base">
                            {t('rateYourExperience') || 'Rate your transfer experience'}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('driverFeedbackPrompt')?.replace('{driverName}', unreviewedTransfer.drivers.name) || 
                             `Your driver ${unreviewedTransfer.drivers.name} would love your feedback`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/customer/review/${unreviewedTransfer.id}`)}
                        variant="accent"
                        size="sm"
                        className="shrink-0 gap-1"
                      >
                        <Star className="h-4 w-4" />
                        {t('rateNow') || 'Rate Now'}
                      </Button>
                    </div>
                  </motion.div>
                );
              }
              return null;
            })()}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                  {t('pastTransfersTitle')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/customer/bookings#past-reservations')}
              >
                {t('viewAll')}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {completedReservations.slice(0, 3).map((reservation, index) => {
                const isCompleted = reservation.status === 'completed';
                const statusConfig = isCompleted
                  ? { key: 'completedLabel', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle }
                  : { key: 'cancelledLabel', color: 'text-red-700', bgColor: 'bg-red-100', icon: X };
                
                const vehicleLabels: Record<string, string> = {
                  'mercedes-vito': 'Mercedes Vito',
                  'mercedes-vito-vip': 'Mercedes Vito VIP',
                  'mercedes-sprinter': 'Sprinter',
                  'minibus': 'Minibüs',
                  'maybach': 'Mercedes Maybach Minivan',
                };
                
                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer shadow-sm hover:shadow-md transition-all overflow-hidden opacity-80 hover:opacity-100",
                        isCompleted ? "border-l-4 border-l-green-500/60" : "border-l-4 border-l-red-500/60"
                      )}
                      onClick={() => navigate(`/customer/reservation/${reservation.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header with code and status */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="font-mono text-xs font-medium text-muted-foreground">
                                {reservation.reservation_code || 'N/A'}
                              </span>
                              <Badge className={cn("text-xs font-medium", statusConfig.bgColor, statusConfig.color)}>
                                {t(statusConfig.key)}
                              </Badge>
                            </div>
                            
                            {/* Route and date info */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate max-w-[100px]">
                                {(reservation.pickup_place_name || reservation.pickup).split(',')[0]}
                              </span>
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {(reservation.dropoff_place_name || reservation.dropoff).split(',')[0]}
                              </span>
                              <span className="text-muted-foreground/60">•</span>
                              <span>{new Date(reservation.pickup_date).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                          
                          {/* Review button for completed transfers */}
                          {isCompleted && reservation.driver_id ? (
                            reservation.hasReview ? (
                              <div className="shrink-0 flex items-center gap-1 text-green-600 text-xs">
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('reviewed') || 'Reviewed'}</span>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-accent hover:text-accent hover:bg-accent/10 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customer/review/${reservation.id}`);
                                }}
                              >
                                <Star className="h-4 w-4 fill-accent" />
                                <span className="hidden sm:inline text-xs">{t('rate') || 'Rate'}</span>
                              </Button>
                            )
                          ) : isCompleted ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Searches - New Feature */}
        {recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('recentSearches')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm transition-colors border border-border/50"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pickup: search.pickup, dropoff: search.dropoff }));
                    setIsBookingFormOpen(true);
                    setTimeout(() => {
                      const formElement = document.getElementById('booking-form');
                      formElement?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[120px]">{search.pickup.split(',')[0]}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[120px]">{search.dropoff.split(',')[0]}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Favorite Routes Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-6"
        >
          <Card className="shadow-md border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t('favoriteRoutes')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('frequentRoutesDesc')}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={() => setIsAddingFavorite(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addFavoriteBtn')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Add New Favorite Route Form */}
              <AnimatePresence>
                {isAddingFavorite && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-muted/50 rounded-lg border border-rose-200 dark:border-rose-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Route className="h-4 w-4 text-rose-500" />
                        {t('newFavoriteRouteTitle')}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setIsAddingFavorite(false);
                          setNewFavoriteRoute({ name: '', pickup: '', dropoff: '', notes: '' });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {t('routeName')}
                        </Label>
                        <Input
                          placeholder={t('routeNameExample')}
                          value={newFavoriteRoute.name}
                          onChange={(e) => setNewFavoriteRoute(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {t('pickupLocationLabel')}
                        </Label>
                        <GooglePlacesAutocomplete
                          initialValue={newFavoriteRoute.pickup}
                          onPlaceSelected={(val) => setNewFavoriteRoute(prev => ({ ...prev, pickup: val }))}
                          onInputChange={(val) => setNewFavoriteRoute(prev => ({ ...prev, pickup: val }))}
                          placeholder={t('enterAddressPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {t('dropoffLocationLabel')}
                        </Label>
                        <GooglePlacesAutocomplete
                          initialValue={newFavoriteRoute.dropoff}
                          onPlaceSelected={(val) => setNewFavoriteRoute(prev => ({ ...prev, dropoff: val }))}
                          onInputChange={(val) => setNewFavoriteRoute(prev => ({ ...prev, dropoff: val }))}
                          placeholder={t('enterAddressPlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {t('notesOptional')}
                        </Label>
                        <Input
                          placeholder={t('specialNotesPlaceholder')}
                          value={newFavoriteRoute.notes}
                          onChange={(e) => setNewFavoriteRoute(prev => ({ ...prev, notes: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleAddFavoriteRoute}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        {t('addToFavoritesBtn')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Favorite Routes List */}
              {favoriteRoutes.length > 0 ? (
                <div className="space-y-2">
                  {favoriteRoutes.map((route, index) => (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="group"
                    >
                      <div
                        className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
                        onClick={() => handleUseFavoriteRoute(route)}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                          <Heart className="h-5 w-5 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm truncate">{route.name}</span>
                            {route.usage_count > 0 && (
                              <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                {route.usage_count}x
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{route.pickup_location.split(',')[0]}</span>
                            <ArrowRight className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{route.dropoff_location.split(',')[0]}</span>
                          </div>
                          {route.notes && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{route.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFavoriteRoute(route.id);
                            }}
                          >
                            <HeartOff className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : !isAddingFavorite ? (
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('noFavoriteRoutes')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingFavorite(true)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addFirstRouteBtn')}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Form with Enhanced Styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card id="booking-form" className="scroll-mt-20 shadow-lg border-border/50">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
            onClick={() => setIsBookingFormOpen(!isBookingFormOpen)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-serif flex items-center gap-2">
                  <Car className="h-5 w-5 sm:h-6 sm:w-6" />
                  {t('bookYourTransfer')}
                </CardTitle>
                <CardDescription>
                  {t('submitTransferDetails')}
                </CardDescription>
              </div>
              <motion.div
                animate={{ rotate: isBookingFormOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform rotate-90"
                )} />
              </motion.div>
            </div>
          </CardHeader>
          <AnimatePresence initial={false}>
            {isBookingFormOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5 relative">
              {/* Loading Overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('processingLabel')}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Pick-up Point */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('pickupPoint')}
                </Label>
                <GooglePlacesAutocomplete
                  onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, pickup: value }))}
                  placeholder={t('enterPickupPoint')}
                  className={errors.pickup ? 'border-destructive' : ''}
                  maxLength={200}
                  disabled={isLoading}
                />
                {errors.pickup && <p className="text-sm text-destructive">{errors.pickup}</p>}
              </div>

              {/* Drop-off Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('dropoffLocation')}
                </Label>
                <GooglePlacesAutocomplete
                  onPlaceSelected={(value) => setFormData((prev) => ({ ...prev, dropoff: value }))}
                  placeholder={t('hotelNameOrAddress')}
                  className={errors.dropoff ? 'border-destructive' : ''}
                  maxLength={200}
                  disabled={isLoading}
                />
                {errors.dropoff && <p className="text-sm text-destructive">{errors.dropoff}</p>}
              </div>

              {/* Route Map Preview */}
              {formData.pickup && formData.dropoff && formData.pickup.length >= 3 && formData.dropoff.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Route className="h-4 w-4" />
                    {t('routePreview') || 'Güzergah Önizlemesi'}
                  </Label>
                  <GoogleRouteMap
                    pickup={formData.pickup}
                    dropoff={formData.dropoff}
                    className="h-[200px] rounded-lg"
                  />
                </motion.div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('date')}
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.date ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('time')}</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className={errors.time ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                </div>
              </div>

              {/* Flight Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  {t('flightNumberOptional')}
                </Label>
                <Input
                  placeholder={t('flightExample')}
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                  maxLength={20}
                  disabled={isLoading}
                />
              </div>

              {/* Passenger Names - Multiple */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('passengers')} ({passengerNames.length})
                </Label>
                {passengerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={index === 0 ? t('primaryPassenger') : `${t('passenger')} ${index + 1}`}
                        value={name}
                        onChange={(e) => updatePassenger(index, e.target.value)}
                        className={index === 0 && errors.passengerNames ? 'border-destructive' : ''}
                        maxLength={100}
                        disabled={isLoading}
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.passengerNames && <p className="text-sm text-destructive">{errors.passengerNames}</p>}
                {passengerNames.length < MAX_PASSENGERS && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPassenger}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('addPassenger')}
                  </Button>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('contactPhone')}
                </Label>
                <PhoneInput
                  value={formData.passengerPhone}
                  onChange={(value) => setFormData({...formData, passengerPhone: value})}
                  className={errors.passengerPhone ? 'border-destructive' : ''}
                  disabled={isLoading}
                />
                {errors.passengerPhone && <p className="text-sm text-destructive">{errors.passengerPhone}</p>}
              </div>

              {/* Luggage & Baby Seat */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {t('luggageCount') || 'Luggage'}
                  </Label>
                  <Select value={formData.luggageCount} onValueChange={(v) => setFormData({...formData, luggageCount: v})} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectLuggage') || 'Luggage'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num} {t('luggage') || 'Luggage'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    {t('babySeat') || 'Baby Seat'}
                  </Label>
                  <Select value={formData.babySeatCount} onValueChange={(v) => setFormData({...formData, babySeatCount: v})} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectBabySeat') || 'Baby Seat'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 3 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Type - Visual Cards */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {t('vehicleType')}
                </Label>
                {minibusRequired && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                    <Briefcase className="h-4 w-4" />
                    <span>{t('minibusRequiredInfo') || 'For 7+ passengers or luggage, only Minibus is available'}</span>
                  </div>
                )}
                <div className={cn(
                  "grid gap-3",
                  availableVehicles.length === 1 ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {availableVehicles.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      disabled={isLoading || (minibusRequired && v.value !== 'minibus')}
                      onClick={() => setFormData({...formData, vehicleType: v.value})}
                      className={cn(
                        "relative overflow-hidden rounded-xl p-3 transition-all duration-200 text-left",
                        "border-2 hover:scale-[1.02] active:scale-[0.98]",
                        formData.vehicleType === v.value
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                          : "border-border bg-card hover:bg-muted/50 hover:border-primary/40",
                        (isLoading || (minibusRequired && v.value !== 'minibus')) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {formData.vehicleType === v.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                        <img
                          src={v.images[0]?.src}
                          alt={v.label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <h3 className={cn(
                        "font-semibold text-sm mb-1",
                        formData.vehicleType === v.value ? "text-primary" : "text-foreground"
                      )}>
                        {v.label}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {v.passengers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {v.luggage}
                        </span>
                      </div>
                      {/* Feature icons - like Hero.tsx */}
                      <div className="flex flex-wrap gap-1.5">
                        {v.features.slice(0, 4).map((feature, idx) => {
                          const { icon: FeatureIcon, color } = getFeatureIconWithColor(feature.icon);
                          return (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded text-[10px]"
                              title={language === 'TR' ? feature.labelTr : feature.label}
                            >
                              <FeatureIcon className={cn("h-2.5 w-2.5", color)} />
                            </div>
                          );
                        })}
                        {v.features.length > 4 && (
                          <div className="flex items-center px-1.5 py-0.5 bg-muted/50 rounded text-[10px] text-muted-foreground">
                            +{v.features.length - 4}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('paymentType')}
                </Label>
                <RadioGroup value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})} disabled={isLoading}>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" disabled={isLoading} />
                    <Label htmlFor="cash" className="cursor-pointer">{t('cashToDriver')}</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="online" id="online" disabled={isLoading} />
                    <Label htmlFor="online" className="cursor-pointer">{t('onlinePaymentLink')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Special Requests / Notes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('specialRequests') || 'Special Requests / Notes'}
                  <span className="text-muted-foreground text-xs">({t('optional') || 'Optional'})</span>
                </Label>
                <Textarea
                  value={formData.customerNotes}
                  onChange={(e) => setFormData({...formData, customerNotes: e.target.value})}
                  placeholder={t('specialRequestsPlaceholder') || 'Flight number, child seat, special requirements...'}
                  className="resize-none min-h-[80px]"
                  maxLength={500}
                  disabled={isLoading}
                />
              </div>

              {/* Price Display Section */}
              {(formData.pickup && formData.dropoff) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {isPricesLoading ? (
                    <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {t('calculatingPrice') || 'Fiyat hesaplanıyor...'}
                        </span>
                      </div>
                    </div>
                  ) : vehiclePrices[formData.vehicleType] ? (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg text-center border border-green-500/30">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-700 dark:text-green-400 text-lg">
                          {t('priceLabel') || 'Fiyat'}: {vehiclePrices[formData.vehicleType]} {priceCurrency}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {VEHICLE_TYPE_MAP[formData.vehicleType]?.label || formData.vehicleType} - {t('bestPriceGuaranteeLabel')}
                      </p>
                    </div>
                  ) : pricesError ? (
                    <div className="bg-amber-500/10 p-4 rounded-lg text-center border border-amber-500/30">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-700 dark:text-amber-400 text-sm">
                          {t('priceOnRequest') || 'Fiyat Talebi Gönderilecek'}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t('priceApprovalMessage')}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Default info message when no locations entered */}
              {(!formData.pickup || !formData.dropoff) && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg text-center border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary text-sm">
                      {t('bestPriceGuaranteeLabel')}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t('enterLocationsForPrice') || 'Alış ve bırakış noktasını girerek fiyatı görün'}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    {t('submitBookingRequest')}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        </motion.div>

        {/* Sticky FABs - Smaller on mobile */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3">
          {/* WhatsApp Support Button */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                onClick={() => {
                  const message = encodeURIComponent(t('helloSupportMsg'));
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
                }}
                size="lg"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg bg-[#25D366] hover:bg-[#22c55e] text-white"
                title={t('whatsAppSupportTooltip')}
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* My Bookings Button */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                onClick={() => navigate('/customer/bookings')}
                size="lg"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                title={t('myBookingsTooltip')}
              >
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
      
      {/* Pending Booking Modal - Complete Missing Info */}
      <Dialog open={showPendingBookingModal} onOpenChange={setShowPendingBookingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-500" />
              {language === 'TR' ? 'Rezervasyonunuz Hazır!' : 'Your Booking is Ready!'}
            </DialogTitle>
            <DialogDescription>
              {language === 'TR' 
                ? 'Rezervasyonunuzu tamamlamak için bilgilerinizi girin.'
                : 'Enter your details to complete your reservation.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {pendingBookingInfo && (
            <div className="space-y-4 py-4">
              {/* Booking Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{pendingBookingInfo.bookingData?.pickup}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{pendingBookingInfo.bookingData?.dropoff}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {pendingBookingInfo.bookingData?.pickup_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pendingBookingInfo.bookingData?.pickup_time}
                  </span>
                </div>
                {pendingBookingInfo.bookingData?.price && (
                  <div className="pt-2 border-t">
                    <span className="text-lg font-bold text-primary">
                      {pendingBookingInfo.bookingData.price} {pendingBookingInfo.bookingData.price_currency || 'EUR'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {language === 'TR' ? 'Ad Soyad' : 'Full Name'}
                  </Label>
                  <Input
                    id="modal-name"
                    value={pendingBookingInfo.customerName}
                    onChange={(e) => setPendingBookingInfo(prev => 
                      prev ? { ...prev, customerName: e.target.value } : null
                    )}
                    placeholder={language === 'TR' ? 'Adınız Soyadınız' : 'Your Full Name'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {language === 'TR' ? 'Telefon' : 'Phone'}
                  </Label>
                  <PhoneInput
                    value={pendingBookingInfo.customerPhone}
                    onChange={(value) => setPendingBookingInfo(prev => 
                      prev ? { ...prev, customerPhone: value } : null
                    )}
                    placeholder={language === 'TR' ? 'Telefon Numaranız' : 'Your Phone Number'}
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                onClick={handleCompletePendingBooking}
                disabled={isCreatingReservation}
                className="w-full h-12 text-base font-semibold"
              >
                {isCreatingReservation ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {language === 'TR' ? 'Oluşturuluyor...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {language === 'TR' ? 'Rezervasyonu Tamamla' : 'Complete Reservation'}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerHome;
