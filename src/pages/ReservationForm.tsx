import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromo } from '@/contexts/PromoContext';
import { validatePromoCode } from '@/hooks/useActivePromoCode';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plane, MapPin, Calendar, User, Phone, Car, Mail, Lock, CheckCircle, ClipboardList, Users, Trash2, UserPlus, CreditCard, Banknote, ArrowLeftRight, X, Tag, CheckCircle2, Clock, Coins, Sparkles, Loader2, Baby, Luggage, Minus, Plus, ThumbsDown, Gift } from 'lucide-react';
import { VehicleSelectionCard } from '@/components/VehicleSelectionCard';
import { cn } from '@/lib/utils';
import { CURRENCY_OPTIONS } from '@/lib/currency';
import { z } from 'zod';
import { GooglePlacesAutocomplete, PlaceDetails } from '@/components/ui/google-places-autocomplete';
import GoogleRouteMap from '@/components/ui/google-route-map';
import { AirlineDisplay } from '@/components/ui/airline-display';
import { FlightStatus } from '@/components/ui/flight-status';
import { trackConversion, CONVERSION_LABELS } from '@/lib/gtag';

// Password format: 1 uppercase, 1 lowercase, at least 4 digits (e.g., Ab2215)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/\d.*\d.*\d.*\d/, 'Password must contain at least 4 digits');

const reservationSchema = z.object({
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits").max(20).regex(/^[+\d\s\-()]+$/, "Invalid phone format"),
  email: z.string().trim().email("Invalid email address").max(255),
  password: passwordSchema.optional(),
  pickup: z.string().trim().min(2, "Pick-up point must be at least 2 characters").max(200, "Pick-up point is too long"),
  dropoff: z.string().trim().min(2, "Drop-off location is required").max(200),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  flightNumber: z.string().trim().max(20).optional().or(z.literal('')),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  paymentMethod: z.enum(['payment_link', 'cash'], { required_error: "Please select a payment option" }),
});

const MAX_PASSENGERS = 15;

// Airports list removed - pickup is now free text

// Use centralized vehicle types
import { VEHICLE_TYPE_OPTIONS as vehicleTypes } from '@/lib/vehicleTypes';

const FORM_STORAGE_KEY = 'reservation_form_draft';

interface StoredFormData {
  formData: typeof defaultFormData;
  passengerNames: string[];
  hasReturnTrip: boolean;
  returnTripData: { date: string; time: string; flightNumber: string };
  promoCode: string;
  isPromoCodeValid: boolean | null;
}

const defaultFormData = {
  phone: '',
  email: '',
  password: '',
  pickup: '',
  dropoff: '',
  date: '',
  time: '',
  flightNumber: '',
  vehicleType: 'mercedes-vito',
  notes: '',
  paymentMethod: '' as 'payment_link' | 'cash' | '',
  pickup_place_name: '',
  pickup_lat: null as number | null,
  pickup_lng: null as number | null,
  dropoff_place_name: '',
  dropoff_lat: null as number | null,
  dropoff_lng: null as number | null,
};

const ReservationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t, getLocalizedPath, language } = useLanguage();
  const { emailAdminNewReservation } = useEmailNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // New flow states for logged-in customer price selection
  const [showPricePreparation, setShowPricePreparation] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [fetchedVehiclePrices, setFetchedVehiclePrices] = useState<Array<{
    vehicleType: string;
    vehicleLabel: string;
    price: number | null;
    currency: string;
    passengers: number;
    luggage: number;
    available: boolean;
    sanityFailed?: boolean;
    sanityReason?: string;
  }>>([]);
  const [selectedVehicleForConfirm, setSelectedVehicleForConfirm] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<typeof defaultFormData | null>(null);
  const [pendingPassengerNames, setPendingPassengerNames] = useState<string[]>([]);
  
  // Reject and auto discount states (like QuickBookingConfirm)
  const [isRejecting, setIsRejecting] = useState(false);
  const [canReject, setCanReject] = useState(true);
  const [isDiscountedOffer, setIsDiscountedOffer] = useState(false);
  const [discountJustApplied, setDiscountJustApplied] = useState(false);
  const [previousVehiclePrices, setPreviousVehiclePrices] = useState<Record<string, number>>({});
  const [appliedDiscountInfo, setAppliedDiscountInfo] = useState<{ amount: number; percentage: number; currency: string } | null>(null);
  
  // Check if coming from QuickBooking flow
  const quickBookingIdParam = searchParams.get('quickBookingId') || '';
  const isFromQuickBookingFlow = !!quickBookingIdParam;
  
  // Check if there's a pending reservation to update
  const pendingReservationId = searchParams.get('reservationId') || '';
  const pendingReservationCode = searchParams.get('reservationCode') || '';
  const returnReservationCode = searchParams.get('returnReservationCode') || '';
  const hasPendingReservation = !!pendingReservationId;
  
  // Redirect non-logged-in users to homepage quick booking form (unless from QuickBooking)
  useEffect(() => {
    if (!authLoading && !user && !isFromQuickBookingFlow) {
      navigate(getLocalizedPath("/#booking-form"), { replace: true });
    }
  }, [user, authLoading, navigate, getLocalizedPath, isFromQuickBookingFlow]);
  const urlPassengerCount = parseInt(searchParams.get('passengers') || '1', 10);
  const [passengerNames, setPassengerNames] = useState<string[]>(() => 
    Array.from({ length: Math.max(1, Math.min(19, urlPassengerCount)) }, () => '')
  );
  // Get initial values from URL params
  const urlPickup = searchParams.get('pickup') || '';
  const urlDropoff = searchParams.get('dropoff') || '';
  const urlDate = searchParams.get('date') || '';
  const urlTime = searchParams.get('time') || '';
  const urlVehicleType = searchParams.get('vehicleType') || '';
  const urlPrice = searchParams.get('price') || '';
  const urlCurrency = searchParams.get('currency') || 'EUR';
  const quickBookingId = searchParams.get('quickBookingId') || '';
  const urlPaymentMethod = searchParams.get('paymentMethod') || '';
  
  // Luggage and baby seat from URL (from CustomerHome form)
  const urlLuggageCount = searchParams.get('luggageCount') || '';
  const urlBabySeatCount = searchParams.get('babySeatCount') || '';
  const urlCustomerNotes = searchParams.get('customerNotes') || '';
  
  // Return trip URL params
  const urlHasReturn = searchParams.get('hasReturn') === 'true';
  const urlReturnDate = searchParams.get('returnDate') || '';
  const urlReturnTime = searchParams.get('returnTime') || '';
  const urlReturnPrice = searchParams.get('returnPrice') || '';
  const urlPromoCode = searchParams.get('promoCode') || '';
  const urlAllVehiclePrices = searchParams.get('allVehiclePrices') || '';
  
  // Check if prices were pre-fetched during animation (from CustomerHome)
  const pricesPreFetched = searchParams.get('pricesPreFetched') === 'true';
  
  // State for vehicle prices and loading
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, number>>({});
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  
  // Parse all vehicle prices from URL (JSON encoded) on mount
  useEffect(() => {
    if (urlAllVehiclePrices) {
      try {
        const parsed = JSON.parse(decodeURIComponent(urlAllVehiclePrices));
        setVehiclePrices(parsed);
      } catch {
        setVehiclePrices({});
      }
    }
  }, [urlAllVehiclePrices]);
  
  // If prices were pre-fetched (from CustomerHome animation), show vehicle selection immediately
  useEffect(() => {
    // Use `user` instead of `isLoggedIn` since isLoggedIn is set after user check
    if (pricesPreFetched && user && urlPickup && urlDropoff && !showVehicleSelection) {
      // Load pre-fetched vehicle prices from sessionStorage
      const storedPrices = sessionStorage.getItem('preFetchedVehiclePrices');
      if (storedPrices) {
        try {
          const parsedPrices = JSON.parse(storedPrices);
          setFetchedVehiclePrices(parsedPrices);
          sessionStorage.removeItem('preFetchedVehiclePrices');
        } catch {
          // If parsing fails, use vehiclePrices from URL
          const pricesArray = Object.entries(vehiclePrices).map(([vehicleType, price]) => ({
            vehicleType,
            vehicleLabel: vehicleType,
            price,
            currency: preferredCurrency,
            passengers: 6,
            luggage: 6,
            available: true,
          }));
          setFetchedVehiclePrices(pricesArray);
        }
      } else if (Object.keys(vehiclePrices).length > 0) {
        // Fallback to URL prices
        const pricesArray = Object.entries(vehiclePrices).map(([vehicleType, price]) => ({
          vehicleType,
          vehicleLabel: vehicleType,
          price,
          currency: preferredCurrency,
          passengers: 6,
          luggage: 6,
          available: true,
        }));
        setFetchedVehiclePrices(pricesArray);
      }
      
      // Load passenger names from sessionStorage
      const savedPassengerNames = sessionStorage.getItem('customerPassengerNames');
      if (savedPassengerNames) {
        try {
          const names = JSON.parse(savedPassengerNames);
          if (Array.isArray(names) && names.length > 0) {
            setPendingPassengerNames(names);
          }
        } catch {
          setPendingPassengerNames(passengerNames.filter(n => n.trim() !== ''));
        }
      } else {
        setPendingPassengerNames(passengerNames.filter(n => n.trim() !== ''));
      }
      
      // Set pending form data and show vehicle selection immediately
      setPendingFormData({
        ...defaultFormData,
        pickup: urlPickup,
        dropoff: urlDropoff,
        date: urlDate,
        time: urlTime,
        vehicleType: urlVehicleType || 'mercedes-vito',
        paymentMethod: (urlPaymentMethod === 'cash' || urlPaymentMethod === 'payment_link') ? urlPaymentMethod : '' as '' | 'cash' | 'payment_link',
        notes: urlCustomerNotes || '',
      });
      setSelectedVehicleForConfirm(urlVehicleType || 'mercedes-vito');
      setShowVehicleSelection(true);
    }
  }, [pricesPreFetched, user, urlPickup, urlDropoff, vehiclePrices, showVehicleSelection]);
  
  // Fetch prices when pickup/dropoff change (only for logged-in users without pre-loaded prices)
  useEffect(() => {
    const fetchPrices = async () => {
      // Only fetch if user is logged in, has pickup/dropoff, and no prices loaded yet
      if (!user || !urlPickup || !urlDropoff) return;
      if (Object.keys(vehiclePrices).length > 0) return;
      if (urlAllVehiclePrices) return; // Already have prices from URL
      if (pricesPreFetched) return; // Already pre-fetched during animation
      
      setIsPricesLoading(true);
      try {
        const { data } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: {
            pickup: urlPickup,
            dropoff: urlDropoff,
            customerCurrency: urlCurrency,
          },
        });
        
        if (data?.prices) {
          const pricesMap: Record<string, number> = {};
          data.prices.forEach((p: any) => {
            if (p.price) {
              pricesMap[p.vehicleType] = p.price;
            }
          });
          setVehiclePrices(pricesMap);
        }
      } catch (error) {
        console.error("Error fetching vehicle prices:", error);
      } finally {
        setIsPricesLoading(false);
      }
    };
    
    fetchPrices();
  }, [user, urlPickup, urlDropoff, urlCurrency, urlAllVehiclePrices, vehiclePrices, pricesPreFetched]);
  
  const [hasReturnTrip, setHasReturnTrip] = useState(urlHasReturn);
  const [promoCode, setPromoCode] = useState(urlPromoCode);
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(urlPromoCode ? true : null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [returnTripData, setReturnTripData] = useState({
    date: urlReturnDate,
    time: urlReturnTime,
    flightNumber: '',
  });
  
  // Baby seat and luggage counts for vehicle selection screen - initialize from URL params
  const [babySeatCount, setBabySeatCount] = useState(() => urlBabySeatCount ? parseInt(urlBabySeatCount) || 0 : 0);
  const [luggageCount, setLuggageCount] = useState(() => urlLuggageCount ? parseInt(urlLuggageCount) || 0 : 0);
  
  // Quick booking pre-filled price display
  const isFromQuickBooking = !!quickBookingId;
  const prefilledPrice = urlPrice ? parseFloat(urlPrice) : null;
  const prefilledCurrency = urlCurrency;
  const prefilledReturnPrice = urlReturnPrice ? parseFloat(urlReturnPrice) : null;
  
  // Currency selection
  const [preferredCurrency, setPreferredCurrency] = useState(urlCurrency || 'EUR');
  
  const currencyOptions = CURRENCY_OPTIONS;

  
  const [formData, setFormData] = useState(() => ({
    ...defaultFormData,
    pickup: urlPickup,
    dropoff: urlDropoff,
    date: urlDate,
    time: urlTime,
    vehicleType: urlVehicleType || defaultFormData.vehicleType,
    paymentMethod: (urlPaymentMethod === 'cash' || urlPaymentMethod === 'payment_link') ? urlPaymentMethod : '' as '' | 'cash' | 'payment_link',
    notes: urlCustomerNotes || defaultFormData.notes,
  }));

  // Load saved form data on mount - but DON'T override URL params if coming from QuickBooking
  useEffect(() => {
    // Skip loading saved data if coming from QuickBooking flow - URL params take priority
    if (isFromQuickBooking) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      return;
    }
    
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: StoredFormData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed.formData, password: '' }));
        if (parsed.passengerNames?.length > 0) {
          setPassengerNames(parsed.passengerNames);
        }
        setHasReturnTrip(parsed.hasReturnTrip || false);
        setReturnTripData(parsed.returnTripData || { date: '', time: '', flightNumber: '' });
        setPromoCode(parsed.promoCode || '');
        setIsPromoCodeValid(parsed.isPromoCodeValid ?? null);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
  }, [isFromQuickBooking]);

  // Save form data whenever it changes
  useEffect(() => {
    const dataToSave: StoredFormData = {
      formData: { ...formData, password: '' },
      passengerNames,
      hasReturnTrip,
      returnTripData,
      promoCode,
      isPromoCodeValid,
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, passengerNames, hasReturnTrip, returnTripData, promoCode, isPromoCodeValid]);

  // Pre-fill form if user is logged in (only email/phone, preserve other form data)
  // Also check for data from CustomerHome sessionStorage
  useEffect(() => {
    // Check for customer data from CustomerHome form
    const savedPassengerNames = sessionStorage.getItem('customerPassengerNames');
    const savedPhone = sessionStorage.getItem('customerPhone');
    
    if (savedPassengerNames) {
      try {
        const names = JSON.parse(savedPassengerNames);
        if (Array.isArray(names) && names.length > 0) {
          setPassengerNames(names);
        }
      } catch (e) {
        console.error('Failed to parse passenger names from session:', e);
      }
      sessionStorage.removeItem('customerPassengerNames');
    }
    
    if (savedPhone) {
      setFormData(prev => ({
        ...prev,
        phone: savedPhone,
      }));
      sessionStorage.removeItem('customerPhone');
    }
    
    if (user) {
      setIsLoggedIn(true);
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
      }));
      
      // Only set passenger name if not already filled and no session data
      if (user.user_metadata?.full_name && passengerNames[0] === '' && !savedPassengerNames) {
        setPassengerNames(prev => {
          if (prev[0] === '') {
            return [user.user_metadata.full_name, ...prev.slice(1)];
          }
          return prev;
        });
      }
      
      // Fetch profile for phone (only if not already filled and no session data)
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
        
        if (data) {
          // Only set passenger name if not already filled and no session data
          if (data.full_name && passengerNames[0] === '' && !savedPassengerNames) {
            setPassengerNames(prev => {
              if (prev[0] === '') {
                return [data.full_name, ...prev.slice(1)];
              }
              return prev;
            });
          }
          // Only set phone if not already filled and no session data
          if (!savedPhone) {
            setFormData(prev => ({
              ...prev,
              phone: prev.phone || data.phone || '',
            }));
          }
        }
      };
      fetchProfile();
    }
  }, [user]);

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

  // Get active promo code from context
  const { promoCode: activePromo } = usePromo();
  
  // Build valid promo codes list from active promo + fallback codes
  const getValidPromoCodes = useCallback(() => {
    const baseCodes = ['meet25return', 'gidisdonus', 'return25', 'meet25'];
    if (activePromo?.code) {
      baseCodes.push(activePromo.code.toLowerCase());
    }
    return baseCodes;
  }, [activePromo]);

  const handlePromoCodeChange = async (value: string) => {
    setPromoCode(value);
    setPromoCodeError(null);
    
    if (value.trim() === '') {
      setIsPromoCodeValid(null);
      return;
    }
    
    setIsValidatingPromo(true);
    try {
      const result = await validatePromoCode(value, language);
      
      if (result.valid) {
        setIsPromoCodeValid(true);
        setPromoCodeError(null);
      } else {
        setIsPromoCodeValid(false);
        setPromoCodeError('errorMessage' in result ? result.errorMessage : null);
      }
    } catch (err) {
      setIsPromoCodeValid(false);
      setPromoCodeError(t("errorValidatingPromoCode") || "Error validating promo code");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate passenger names
    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      setErrors({ passengerNames: 'At least one passenger name is required' });
      toast.error('Please enter at least one passenger name');
      return;
    }

    // Validate return trip if enabled
    if (hasReturnTrip) {
      if (!returnTripData.date) {
        setErrors(prev => ({ ...prev, returnDate: 'Please select a return date' }));
        toast.error('Please select a return date');
        return;
      }
      if (!returnTripData.time) {
        setErrors(prev => ({ ...prev, returnTime: 'Please select a return time' }));
        toast.error('Please select a return time');
        return;
      }
    }

    // Validate - password only required if not logged in
    const schemaToUse = isLoggedIn 
      ? reservationSchema.omit({ password: true })
      : reservationSchema.extend({ password: passwordSchema });

    const result = schemaToUse.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    // For logged-in users NOT coming from QuickBooking, show price preparation flow
    if (isLoggedIn && !isFromQuickBooking && !hasPendingReservation) {
      setIsLoading(true);
      setShowPricePreparation(true);
      setPendingFormData({ ...formData });
      setPendingPassengerNames([...validPassengerNames]);
      
      try {
        // Fetch all vehicle prices
        const { data } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: {
            pickup: formData.pickup,
            dropoff: formData.dropoff,
            customerCurrency: preferredCurrency,
          },
        });

        // Wait 3 seconds for animation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (data?.prices && data.prices.length > 0) {
          setFetchedVehiclePrices(data.prices);
          // Set initial selection to the form's vehicle type
          setSelectedVehicleForConfirm(formData.vehicleType);
        } else {
          // No prices found - set empty array
          setFetchedVehiclePrices([]);
          setSelectedVehicleForConfirm(formData.vehicleType);
        }
        
        setShowPricePreparation(false);
        setShowVehicleSelection(true);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Error fetching prices:", error);
        // Continue with normal flow if price fetching fails
        setShowPricePreparation(false);
        setFetchedVehiclePrices([]);
        setSelectedVehicleForConfirm(formData.vehicleType);
        setShowVehicleSelection(true);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      let userId: string;
      const primaryPassengerName = validPassengerNames[0].trim();

      if (isLoggedIn && user) {
        // Already logged in, use current user
        userId = user.id;
        
        // Update profile if needed
        await supabase
          .from('profiles')
          .update({ phone: formData.phone.trim(), full_name: primaryPassengerName })
          .eq('id', userId);
      } else {
        // Try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer/bookings`,
            data: {
              full_name: primaryPassengerName,
            },
          },
        });

        if (signUpError) {
          // Handle "user already exists" - try to sign in
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
            // Try to sign in with provided password
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email.trim(),
              password: formData.password,
            });

            if (signInError) {
              toast.error('Email already registered. Please use correct password or login separately.');
              setIsLoading(false);
              return;
            }

            if (!signInData.user) {
              toast.error('Failed to sign in. Please try logging in separately.');
              navigate('/auth');
              setIsLoading(false);
              return;
            }

            userId = signInData.user.id;
          } else {
            throw signUpError;
          }
        } else {
          if (!signUpData.user) {
            toast.error('Failed to create account. Please try again.');
            setIsLoading(false);
            return;
          }

          userId = signUpData.user.id;

          // If no session, sign in with the password
          if (!signUpData.session) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email.trim(),
              password: formData.password,
            });

            if (signInError) {
              if (signInError.message.includes('Email not confirmed')) {
                toast.info('Please check your email to confirm your account, then try again.');
                setIsLoading(false);
                return;
              }
              throw signInError;
            }
          }
        }

        // Update profile with phone
        await supabase
          .from('profiles')
          .update({ phone: formData.phone.trim(), full_name: primaryPassengerName })
          .eq('id', userId);
      }

      // Determine status and price based on whether coming from quick booking
      const reservationStatus = hasPendingReservation ? 'customer_approved' : (isFromQuickBooking && prefilledPrice ? 'customer_approved' : 'awaiting-price');
      const reservationPrice = isFromQuickBooking && prefilledPrice ? prefilledPrice : null;
      const reservationCurrency = isFromQuickBooking ? prefilledCurrency : preferredCurrency;

      let reservation: any;

      // If we have a pending reservation, update it instead of creating a new one
      if (hasPendingReservation) {
        const { data: updatedReservation, error: updateError } = await supabase
          .from('reservations')
          .update({
            customer_id: userId,
            customer_name: primaryPassengerName,
            customer_phone: formData.phone.trim(),
            passenger_names: validPassengerNames.map(n => n.trim()),
            flight_number: formData.flightNumber?.trim() || null,
            status: 'customer_approved',
            // Place details
            pickup_place_name: formData.pickup_place_name || null,
            pickup_lat: formData.pickup_lat,
            pickup_lng: formData.pickup_lng,
            dropoff_place_name: formData.dropoff_place_name || null,
            dropoff_lat: formData.dropoff_lat,
            dropoff_lng: formData.dropoff_lng,
          })
          .eq('id', pendingReservationId)
          .select()
          .single();

        if (updateError) throw updateError;
        reservation = updatedReservation;

        // Also update return reservation if exists
        if (returnReservationCode) {
          await supabase
            .from('reservations')
            .update({
              customer_id: userId,
              customer_name: primaryPassengerName,
              customer_phone: formData.phone.trim(),
              passenger_names: validPassengerNames.map(n => n.trim()),
              flight_number: returnTripData.flightNumber?.trim() || null,
              status: 'customer_approved',
            })
            .eq('reservation_code', returnReservationCode);
        }
      } else {
        // Create new reservation
        const { data: newReservation, error: reservationError } = await supabase
          .from('reservations')
          .insert({
            customer_id: userId,
            customer_name: primaryPassengerName,
            customer_phone: formData.phone.trim(),
            passenger_names: validPassengerNames.map(n => n.trim()),
            pickup: formData.pickup,
            dropoff: formData.dropoff.trim(),
            pickup_date: formData.date,
            pickup_time: formData.time,
            flight_number: formData.flightNumber?.trim() || null,
            vehicle_type: formData.vehicleType,
            payment_type: formData.paymentMethod,
            status: reservationStatus,
            price: reservationPrice,
            price_currency: reservationCurrency,
            // Place details
            pickup_place_name: formData.pickup_place_name || null,
            pickup_lat: formData.pickup_lat,
            pickup_lng: formData.pickup_lng,
            dropoff_place_name: formData.dropoff_place_name || null,
            dropoff_lat: formData.dropoff_lat,
            dropoff_lng: formData.dropoff_lng,
          })
          .select()
          .single();

        if (reservationError) throw reservationError;
        reservation = newReservation;
      }

      // Update quick booking request with customer email if coming from quick booking
      if (quickBookingId) {
        await supabase
          .from('quick_booking_requests')
          .update({ 
            status: 'completed',
            customer_email: formData.email.trim(),
            customer_name: primaryPassengerName,
            customer_phone: formData.phone.trim(),
          })
          .eq('id', quickBookingId);
      }

      // Notify admin about new reservation (in-app notification)
      try {
        const notifyResponse = await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: reservation.id,
            customer_name: primaryPassengerName,
            pickup: formData.pickup,
            dropoff: formData.dropoff.trim(),
            pickup_date: formData.date,
          }
        });

        if (notifyResponse.error) {
          console.error('Admin notification error:', notifyResponse.error);
          // Don't show error to customer, just log it
        }
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
        // Don't block the user - reservation was created successfully
      }

      // Try auto-pricing for logged-in customer reservations (not from quick booking)
      if (!isFromQuickBooking && !hasPendingReservation) {
        try {
          const { data: autoPriceResult } = await supabase.functions.invoke('auto-price-reservation', {
            body: { reservation_id: reservation.id }
          });
          
          if (autoPriceResult?.matched) {
            console.log('Auto-pricing successful:', autoPriceResult);
            toast.success(`Fiyat: ${autoPriceResult.price} ${autoPriceResult.currency}`);
          }
        } catch (autoPriceError) {
          console.error('Auto-pricing failed:', autoPriceError);
          // Continue with normal flow - admin will price manually
        }
      }

      // Send email notification to admin
      try {
        await emailAdminNewReservation(reservation.id);
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError);
      }

      // Create return trip reservation if enabled
      if (hasReturnTrip && returnTripData.date && returnTripData.time) {
        const { data: returnReservation, error: returnError } = await supabase
          .from('reservations')
          .insert({
            customer_id: userId,
            customer_name: primaryPassengerName,
            customer_phone: formData.phone.trim(),
            passenger_names: validPassengerNames.map(n => n.trim()),
            pickup: formData.dropoff.trim(), // Swapped for return
            dropoff: formData.pickup, // Swapped for return
            pickup_date: returnTripData.date,
            pickup_time: returnTripData.time,
            flight_number: returnTripData.flightNumber?.trim() || null,
            vehicle_type: formData.vehicleType,
            payment_type: formData.paymentMethod,
            status: 'awaiting-price',
            price: null,
            price_currency: null,
            // Promo code for return trip
            promo_code: isPromoCodeValid ? promoCode.trim() : null,
            // Place details - swapped for return trip
            pickup_place_name: formData.dropoff_place_name || null,
            pickup_lat: formData.dropoff_lat,
            pickup_lng: formData.dropoff_lng,
            dropoff_place_name: formData.pickup_place_name || null,
            dropoff_lat: formData.pickup_lat,
            dropoff_lng: formData.pickup_lng,
          })
          .select()
          .single();

        if (returnError) {
          console.error('Return reservation error:', returnError);
          toast.error('Outbound trip created, but return trip failed. Please book return separately.');
        } else {
          // Notify admin about return reservation
          try {
            await supabase.functions.invoke('notify-admin-new-reservation', {
              body: {
                reservation_id: returnReservation.id,
                customer_name: primaryPassengerName,
                pickup: formData.dropoff.trim(),
                dropoff: formData.pickup,
                pickup_date: returnTripData.date,
              }
            });
            await emailAdminNewReservation(returnReservation.id);
          } catch (notifyError) {
            console.error('Failed to notify admin about return trip:', notifyError);
          }
        }
      }

      const successMessage = hasReturnTrip 
        ? 'Both reservations submitted! We will contact you with pricing.'
        : 'Reservation submitted! We will contact you with pricing.';
      toast.success(successMessage);
      
      // Clear saved form data after successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      
      // Fire Google Ads conversion event on successful booking submission
      trackConversion(CONVERSION_LABELS.RESERVATION_SUBMIT);
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create reservation after vehicle selection
  const handleConfirmVehicleSelection = async () => {
    if (!pendingFormData || !user) return;
    
    setIsLoading(true);
    
    try {
      const validPassengerNames = pendingPassengerNames;
      const primaryPassengerName = validPassengerNames[0].trim();
      const userId = user.id;
      
      // Update profile if needed
      await supabase
        .from('profiles')
        .update({ phone: pendingFormData.phone.trim(), full_name: primaryPassengerName })
        .eq('id', userId);
      
      // Get selected vehicle's price
      const selectedPriceInfo = fetchedVehiclePrices.find(v => v.vehicleType === selectedVehicleForConfirm);
      const reservationPrice = selectedPriceInfo?.price || null;
      const reservationCurrency = selectedPriceInfo?.currency || preferredCurrency;
      const hasPrice = reservationPrice !== null;
      
      // Create reservation
      const { data: newReservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          customer_id: userId,
          customer_name: primaryPassengerName,
          customer_phone: pendingFormData.phone.trim(),
          passenger_names: validPassengerNames.map(n => n.trim()),
          pickup: pendingFormData.pickup,
          dropoff: pendingFormData.dropoff.trim(),
          pickup_date: pendingFormData.date,
          pickup_time: pendingFormData.time,
          flight_number: pendingFormData.flightNumber?.trim() || null,
          vehicle_type: selectedVehicleForConfirm,
          payment_type: pendingFormData.paymentMethod,
          status: hasPrice ? 'customer_approved' : 'awaiting-price',
          price: reservationPrice,
          price_currency: reservationCurrency,
          pickup_place_name: pendingFormData.pickup_place_name || null,
          pickup_lat: pendingFormData.pickup_lat,
          pickup_lng: pendingFormData.pickup_lng,
          dropoff_place_name: pendingFormData.dropoff_place_name || null,
          dropoff_lat: pendingFormData.dropoff_lat,
          dropoff_lng: pendingFormData.dropoff_lng,
          promo_code: isPromoCodeValid ? promoCode.trim() : null,
          baby_seat_count: babySeatCount > 0 ? babySeatCount : null,
          luggage_count: luggageCount > 0 ? luggageCount : null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Notify admin
      try {
        await supabase.functions.invoke('notify-admin-new-reservation', {
          body: {
            reservation_id: newReservation.id,
            customer_name: primaryPassengerName,
            pickup: pendingFormData.pickup,
            dropoff: pendingFormData.dropoff.trim(),
            pickup_date: pendingFormData.date,
          }
        });
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
      }

      // Send email notification
      try {
        await emailAdminNewReservation(newReservation.id);
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError);
      }

      // Create return trip if enabled
      if (hasReturnTrip && returnTripData.date && returnTripData.time) {
        const returnPrice = isPromoCodeValid && reservationPrice ? Math.round(reservationPrice * 0.7) : reservationPrice;
        
        const { data: returnReservation, error: returnError } = await supabase
          .from('reservations')
          .insert({
            customer_id: userId,
            customer_name: primaryPassengerName,
            customer_phone: pendingFormData.phone.trim(),
            passenger_names: validPassengerNames.map(n => n.trim()),
            pickup: pendingFormData.dropoff.trim(),
            dropoff: pendingFormData.pickup,
            pickup_date: returnTripData.date,
            pickup_time: returnTripData.time,
            flight_number: returnTripData.flightNumber?.trim() || null,
            vehicle_type: selectedVehicleForConfirm,
            payment_type: pendingFormData.paymentMethod,
            status: hasPrice ? 'customer_approved' : 'awaiting-price',
            price: returnPrice,
            price_currency: reservationCurrency,
            promo_code: isPromoCodeValid ? promoCode.trim() : null,
            pickup_place_name: pendingFormData.dropoff_place_name || null,
            pickup_lat: pendingFormData.dropoff_lat,
            pickup_lng: pendingFormData.dropoff_lng,
            dropoff_place_name: pendingFormData.pickup_place_name || null,
            dropoff_lat: pendingFormData.pickup_lat,
            dropoff_lng: pendingFormData.pickup_lng,
          })
          .select()
          .single();

        if (returnError) {
          console.error('Return reservation error:', returnError);
          toast.error('Outbound trip created, but return trip failed.');
        } else {
          try {
            await supabase.functions.invoke('notify-admin-new-reservation', {
              body: {
                reservation_id: returnReservation.id,
                customer_name: primaryPassengerName,
                pickup: pendingFormData.dropoff.trim(),
                dropoff: pendingFormData.pickup,
                pickup_date: returnTripData.date,
              }
            });
            await emailAdminNewReservation(returnReservation.id);
          } catch (notifyError) {
            console.error('Failed to notify admin about return trip:', notifyError);
          }
        }
      }

      toast.success(hasReturnTrip 
        ? 'Both reservations submitted successfully!'
        : 'Reservation submitted successfully!');
      
      localStorage.removeItem(FORM_STORAGE_KEY);
      trackConversion(CONVERSION_LABELS.RESERVATION_SUBMIT);
      
      // Reset states
      setShowVehicleSelection(false);
      setPendingFormData(null);
      setPendingPassengerNames([]);
      setFetchedVehiclePrices([]);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Reservation error:', error);
      toast.error(error.message || 'Failed to submit reservation');
    } finally {
      setIsLoading(false);
    }
  };

  // Get recommended vehicle based on passenger count
  const getRecommendedVehicle = (passengers: number): string => {
    if (passengers >= 7) return 'minibus';
    if (passengers >= 5) return 'mercedes-vito';
    return 'vip-mercedes';
  };

  // Handle price rejection with auto discount (like QuickBookingConfirm)
  const handleRejectPrice = async () => {
    if (!selectedVehicleForConfirm || !canReject) return;

    setIsRejecting(true);
    try {
      const selectedPriceInfo = fetchedVehiclePrices.find(v => v.vehicleType === selectedVehicleForConfirm);
      if (!selectedPriceInfo?.price) {
        toast.error(t('language') === 'TR' ? 'Fiyat bulunamadı' : 'Price not found');
        setIsRejecting(false);
        return;
      }

      // Store previous prices for animation
      const oldPricesMap: Record<string, number> = {};
      fetchedVehiclePrices.forEach(v => {
        if (v.price) oldPricesMap[v.vehicleType] = v.price;
      });
      setPreviousVehiclePrices(oldPricesMap);

      // Calculate discount dynamically based on currency (5% discount with min/max limits)
      const discountPercentage = 0.05;
      const minDiscount: Record<string, number> = { EUR: 2, USD: 2, GBP: 2, TRY: 80, AED: 8 };
      const maxDiscount: Record<string, number> = { EUR: 8, USD: 9, GBP: 7, TRY: 300, AED: 35 };
      
      const currency = selectedPriceInfo.currency;
      const calculatedDiscount = Math.round(selectedPriceInfo.price * discountPercentage);
      const discountAmount = Math.max(
        minDiscount[currency] || 2,
        Math.min(calculatedDiscount, maxDiscount[currency] || 8)
      );

      // Update all vehicle prices with discount
      setFetchedVehiclePrices(prevPrices => 
        prevPrices.map(v => ({
          ...v,
          price: v.price ? Math.max(v.price - discountAmount, 1) : null,
        }))
      );

      // Store discount info for badge display
      const actualPercentage = Math.round((discountAmount / selectedPriceInfo.price) * 100);
      setAppliedDiscountInfo({ amount: discountAmount, percentage: actualPercentage, currency });
      
      setDiscountJustApplied(true);
      setIsDiscountedOffer(true);
      setCanReject(false);

      // Trigger confetti celebration 🎉
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }
        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti from left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
        });
        
        // Confetti from right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
        });
      }, 250);

      // Show animated gift icon toast
      toast.success(
        t('language') === 'TR' 
          ? `🎁 Özel indiriminiz uygulandı! -${discountAmount} ${currency}` 
          : `🎁 Special discount applied! -${discountAmount} ${currency}`,
        { duration: 4000 }
      );

      // Clear animation after 4 seconds
      setTimeout(() => {
        setDiscountJustApplied(false);
        setPreviousVehiclePrices({});
      }, 4000);

    } catch (error: any) {
      console.error('Reject price error:', error);
      toast.error(error.message || 'Failed to apply discount');
    } finally {
      setIsRejecting(false);
    }
  };

  // Price preparation animation screen
  if (showPricePreparation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              {/* Animated car icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-pulse">
                  <Car className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-green-400/30 animate-ping" />
              </div>
              
              {/* Main title with shimmer effect */}
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite]">
                {t('language') === 'TR' ? 'En İyi Fiyat Hazırlanıyor' : 'Preparing Best Price'}
              </h1>
              
              {/* Subtitle */}
              <p className="text-muted-foreground mb-8 text-sm">
                {t('language') === 'TR' 
                  ? 'Araç seçenekleri ve fiyatlar yükleniyor...' 
                  : 'Loading vehicle options and prices...'}
              </p>
              
              {/* Progress bar animation */}
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full"
                    style={{ animation: 'progressSlide 3s ease-out forwards' }}
                  />
                </div>
              </div>
              
              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('language') === 'TR' ? 'En İyi Fiyat Garantisi' : 'Best Price Guarantee'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  {t('language') === 'TR' ? 'Gizli Ücret Yok' : 'No Hidden Fees'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes progressSlide {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Vehicle selection screen after price preparation
  if (showVehicleSelection && pendingFormData) {
    const recommendedVehicle = getRecommendedVehicle(pendingPassengerNames.length);
    const selectedPriceInfo = fetchedVehiclePrices.find(v => v.vehicleType === selectedVehicleForConfirm);
    const selectedPrice = selectedPriceInfo?.price || null;
    const selectedCurrency = selectedPriceInfo?.currency || preferredCurrency;
    
    // Calculate return price - always discounted for return trips
    const RETURN_DISCOUNT_PERCENTAGE = 10; // 10% discount for return trip by default
    const PROMO_DISCOUNT_PERCENTAGE = 25; // 25% discount with promo code
    
    const getReturnPrice = () => {
      if (!hasReturnTrip || !selectedPrice) return null;
      // Promo code gives 25% off, otherwise 10% default return discount
      const discountPercent = isPromoCodeValid ? PROMO_DISCOUNT_PERCENTAGE : RETURN_DISCOUNT_PERCENTAGE;
      return Math.round(selectedPrice * (100 - discountPercent) / 100);
    };
    
    const returnPrice = getReturnPrice();
    const returnOriginalPrice = selectedPrice; // Original return price (same as outbound)
    const returnDiscountPercent = isPromoCodeValid ? PROMO_DISCOUNT_PERCENTAGE : RETURN_DISCOUNT_PERCENTAGE;
    const returnDiscountAmount = hasReturnTrip && selectedPrice ? Math.round(selectedPrice * returnDiscountPercent / 100) : null;
    const totalPrice = selectedPrice ? selectedPrice + (returnPrice || 0) : null;
    const totalWithoutDiscount = hasReturnTrip && selectedPrice ? selectedPrice * 2 : selectedPrice;
    const totalSavings = hasReturnTrip && returnDiscountAmount ? returnDiscountAmount : null;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-3 sm:p-4">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            {/* Header with Best Price Animation */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-bounce">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('language') === 'TR' ? 'En İyi Fiyatlarımız' : 'Our Best Prices'}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('language') === 'TR' 
                  ? 'Transferiniz için en uygun aracı seçin' 
                  : 'Choose the best vehicle for your transfer'}
              </p>
            </div>

            {/* Transfer Details - Mobile Optimized */}
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('pickupPoint')}</p>
                  <p className="font-medium text-sm sm:text-base truncate">{pendingFormData.pickup}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('dropoffLocation')}</p>
                  <p className="font-medium text-sm sm:text-base truncate">{pendingFormData.dropoff}</p>
                </div>
              </div>

              {/* Date, Time, Passengers - Responsive Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-border/50">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('date')}</p>
                  <p className="font-medium text-xs sm:text-sm">{pendingFormData.date}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('time')}</p>
                  <p className="font-medium text-xs sm:text-sm">{pendingFormData.time}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('passengers')}</p>
                  <p className="font-medium text-xs sm:text-sm">{pendingPassengerNames.length}</p>
                </div>
              </div>
            </div>

            {/* Route Map */}
            <div className="mb-6">
              <GoogleRouteMap 
                pickup={pendingFormData.pickup}
                dropoff={pendingFormData.dropoff}
                showNavigationButtons={false}
              />
            </div>

            {/* Discount Applied Animation Banner */}
            {discountJustApplied && (
              <div className="mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 animate-scale-in">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">
                        {t('language') === 'TR' ? '🎉 Özel İndirim Uygulandı!' : '🎉 Special Discount Applied!'}
                      </p>
                      <p className="text-sm text-white/90">
                        {t('language') === 'TR' ? 'Yeni fiyatlarınız aşağıda gösterilmektedir' : 'Your new prices are shown below'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Already Discounted Badge */}
            {isDiscountedOffer && !discountJustApplied && (
              <div className="mb-4 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium">
                  <Gift className="h-4 w-4" />
                  {t('language') === 'TR' ? 'İndirimli Fiyat' : 'Discounted Price'}
                </span>
              </div>
            )}

            {/* Vehicle Selection */}
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('vehicleType')}
              </h3>
              
              {/* Check if all vehicles have sanity failed or no available vehicles */}
              {(() => {
                const hasAnyAvailable = fetchedVehiclePrices.some(v => v.available && v.price);
                const hasSanityFailed = fetchedVehiclePrices.some(v => v.sanityFailed);
                
                // All sanity failed - show preparing price message
                if (fetchedVehiclePrices.length > 0 && !hasAnyAvailable && hasSanityFailed) {
                  return (
                    <div className="space-y-2 sm:space-y-4">
                      {/* Price being prepared message */}
                      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 animate-pulse">
                          <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-200">
                            {t('language') === 'TR' 
                              ? '🕐 Fiyat Hazırlanıyor' 
                              : '🕐 Price Being Prepared'}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {t('language') === 'TR'
                              ? 'Bu güzergah için özel fiyatlandırma yapılıyor. En kısa sürede size en iyi fiyatımızla dönüş yapacağız.'
                              : 'Special pricing is being prepared for this route. We will get back to you shortly.'}
                          </p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                              {t('language') === 'TR' ? '30 dk içinde yanıt' : 'Response within 30 min'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Show vehicles without prices */}
                      {vehicleTypes.map(vehicle => (
                        <VehicleSelectionCard
                          key={vehicle.value}
                          vehicleType={vehicle.value}
                          isSelected={selectedVehicleForConfirm === vehicle.value}
                          onSelect={(v) => setSelectedVehicleForConfirm(v)}
                          price={null}
                          currency={preferredCurrency}
                          showPrice={false}
                          isRecommended={vehicle.value === recommendedVehicle}
                          available={true}
                        />
                      ))}
                    </div>
                  );
                }
                
                // Normal flow - has available vehicles with prices
                if (fetchedVehiclePrices.length > 0 && hasAnyAvailable) {
                  return (
                    <div className="grid gap-2 sm:gap-4">
                      {fetchedVehiclePrices.map((vehicle, index) => {
                        const isSelected = selectedVehicleForConfirm === vehicle.vehicleType;
                        const isRecommended = vehicle.vehicleType === recommendedVehicle && vehicle.available;
                        const previousPrice = previousVehiclePrices[vehicle.vehicleType];
                        const hasDiscount = previousPrice && vehicle.price && previousPrice > vehicle.price;
                        
                        return (
                          <div 
                            key={vehicle.vehicleType} 
                            className={cn(
                              "relative transition-all duration-500 opacity-0 translate-y-4",
                              "animate-[slideUp_0.5s_ease-out_forwards]",
                              discountJustApplied && hasDiscount && "animate-fade-in"
                            )}
                            style={{ animationDelay: `${index * 150}ms` }}
                          >
                        {/* Best Price Badge for first available vehicle */}
                            {index === 0 && vehicle.available && vehicle.price && !discountJustApplied && (
                              <div className="absolute -top-2 sm:-top-3 left-2 sm:left-4 z-10">
                                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full animate-pulse shadow-lg">
                                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">{t('language') === 'TR' ? 'En İyi Fiyat' : 'Best Price'}</span>
                                  <span className="xs:hidden">🌟</span>
                                </span>
                              </div>
                            )}
                            
                            {/* Previous Price Strike-through */}
                            {hasDiscount && discountJustApplied && (
                              <div className="absolute -top-2 right-2 sm:right-4 z-10">
                                <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full line-through">
                                  {previousPrice} {vehicle.currency}
                                </span>
                              </div>
                            )}
                            
                            <VehicleSelectionCard
                              vehicleType={vehicle.vehicleType}
                              isSelected={isSelected}
                              onSelect={(v) => setSelectedVehicleForConfirm(v)}
                              price={vehicle.price}
                              currency={vehicle.currency}
                              showPrice={true}
                              isRecommended={isRecommended}
                              available={vehicle.available}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                // Fallback - no prices found at all
                return (
                  /* No prices found - show all vehicles without prices */
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-start gap-2 p-2 sm:p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 mb-3 sm:mb-4">
                      <Coins className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-medium">
                          {t('language') === 'TR' 
                            ? 'Otomatik fiyat bulunamadı' 
                            : 'No automatic pricing found'}
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-1">
                          {t('language') === 'TR'
                            ? 'Fiyat onaydan sonra iletilecek.'
                            : 'Price provided after confirmation.'}
                        </p>
                      </div>
                    </div>
                    
                    {vehicleTypes.map(vehicle => (
                      <VehicleSelectionCard
                        key={vehicle.value}
                        vehicleType={vehicle.value}
                        isSelected={selectedVehicleForConfirm === vehicle.value}
                        onSelect={(v) => setSelectedVehicleForConfirm(v)}
                        price={null}
                        currency={preferredCurrency}
                        showPrice={false}
                        isRecommended={vehicle.value === recommendedVehicle}
                        available={true}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Baby Seat and Luggage */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {/* Baby Seat Count */}
              <div className="bg-muted/50 rounded-lg p-2.5 sm:p-4">
                <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  <Baby className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="hidden xs:inline">{t('language') === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}</span>
                  <span className="xs:hidden">{t('language') === 'TR' ? 'Bebek K.' : 'Baby'}</span>
                </Label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setBabySeatCount(Math.max(0, babySeatCount - 1))}
                    disabled={babySeatCount === 0}
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">{babySeatCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setBabySeatCount(Math.min(3, babySeatCount + 1))}
                    disabled={babySeatCount >= 3}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {/* Luggage Count */}
              <div className="bg-muted/50 rounded-lg p-2.5 sm:p-4">
                <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  <Luggage className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="hidden xs:inline">{t('language') === 'TR' ? 'Bagaj Sayısı' : 'Luggage'}</span>
                  <span className="xs:hidden">{t('language') === 'TR' ? 'Bagaj' : 'Bags'}</span>
                </Label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                    disabled={luggageCount === 0}
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">{luggageCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setLuggageCount(Math.min(20, luggageCount + 1))}
                    disabled={luggageCount >= 20}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Return Trip Option with Date/Time Selection - Mobile Optimized */}
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <input
                  type="checkbox"
                  id="returnTripVehicleScreen"
                  checked={hasReturnTrip}
                  onChange={(e) => setHasReturnTrip(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="returnTripVehicleScreen" className="flex items-center gap-2 cursor-pointer font-medium text-sm sm:text-base">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  {t('language') === 'TR' ? 'Dönüş Transferi Ekle' : 'Add Return Transfer'}
                  {!isPromoCodeValid && hasReturnTrip && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      -10%
                    </span>
                  )}
                </Label>
              </div>

              {hasReturnTrip && (
                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-3 border-t">
                  {/* Return Date & Time - Side by side on all screens */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t('language') === 'TR' ? 'Dönüş Tarihi' : 'Return Date'}
                      </Label>
                      <Input
                        type="date"
                        value={returnTripData.date}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                        min={pendingFormData?.date || new Date().toISOString().split('T')[0]}
                        className="w-full h-10 sm:h-11 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t('language') === 'TR' ? 'Dönüş Saati' : 'Return Time'}
                      </Label>
                      <Input
                        type="time"
                        value={returnTripData.time}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full h-10 sm:h-11 text-sm"
                      />
                    </div>
                  </div>

                  {/* Promo Code for Return */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                      {t('language') === 'TR' ? 'Promosyon Kodu (Opsiyonel)' : 'Promo Code (Optional)'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={promoCode}
                        onChange={(e) => handlePromoCodeChange(e.target.value)}
                        placeholder={activePromo?.code || "Meet30Return"}
                        className={cn(
                          "pr-10 h-10 sm:h-11 text-sm",
                          isPromoCodeValid === true && "border-green-500 bg-green-50 dark:bg-green-950/20",
                          isPromoCodeValid === false && "border-destructive"
                        )}
                      />
                      {isValidatingPromo && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground animate-spin" />
                      )}
                      {!isValidatingPromo && isPromoCodeValid === true && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      )}
                      {!isValidatingPromo && isPromoCodeValid === false && (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      )}
                    </div>
                    {isPromoCodeValid === true && (
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        {language === 'TR' ? 'Dönüşte %30 indirim kazandınız!' : '30% off on return transfer!'}
                      </p>
                    )}
                    {isPromoCodeValid === false && promoCodeError && (
                      <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        {promoCodeError}
                      </p>
                    )}
                    {!isPromoCodeValid && !promoCodeError && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'TR' 
                          ? 'Kod olmadan da %10 dönüş indirimi otomatik uygulanır' 
                          : '10% return discount is applied automatically without a code'}
                      </p>
                    )}
                    {activePromo?.validUntil && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('language') === 'TR' 
                          ? `Kod son kullanım: ${new Date(activePromo.validUntil).toLocaleDateString('tr-TR')}` 
                          : `Code valid until: ${new Date(activePromo.validUntil).toLocaleDateString('en-US')}`}
                      </p>
                    )}
                  </div>

                  {/* Return Route Info - Compact */}
                  <div className="text-xs sm:text-sm text-muted-foreground bg-background/50 p-2 sm:p-3 rounded-lg flex items-center gap-2">
                    <ArrowLeftRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <p className="truncate">
                      <span className="font-medium">{t('language') === 'TR' ? 'Dönüş:' : 'Return:'}</span> {pendingFormData?.dropoff?.split(',')[0]} → {pendingFormData?.pickup?.split(',')[0]}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary - Mobile Optimized */}
            {selectedPrice && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="space-y-2 sm:space-y-3">
                  {/* Outbound Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{t('language') === 'TR' ? 'Gidiş' : 'Outbound'}</span>
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{selectedPrice} {selectedCurrency}</span>
                  </div>
                  
                  {/* Return Price */}
                  {hasReturnTrip && returnPrice && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <span className="text-xs sm:text-sm text-muted-foreground">{t('language') === 'TR' ? 'Dönüş' : 'Return'}</span>
                        </div>
                        <div className="text-right flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm line-through text-muted-foreground">
                            {returnOriginalPrice} {selectedCurrency}
                          </span>
                          <span className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">{returnPrice} {selectedCurrency}</span>
                        </div>
                      </div>
                      
                      {/* Discount Badge - Compact */}
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                        <span className="flex items-center gap-1.5 text-green-700 dark:text-green-300 text-xs sm:text-sm">
                          <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">
                            {isPromoCodeValid 
                              ? (t('language') === 'TR' ? 'Promo Kod İndirimi' : 'Promo Discount') 
                              : (t('language') === 'TR' ? 'Dönüş İndirimi' : 'Return Discount')}
                          </span>
                          <span className="font-bold">
                            ({isPromoCodeValid ? '30%' : '10%'})
                          </span>
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-green-600 dark:text-green-400">
                          -{returnDiscountAmount} {selectedCurrency}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Divider & Total */}
                  <div className="border-t border-primary/20 pt-2 sm:pt-3 mt-1 sm:mt-2">
                    {/* Total without discount (only if return trip) */}
                    {hasReturnTrip && totalSavings && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-1">
                        <span>{t('language') === 'TR' ? 'Ara Toplam' : 'Subtotal'}</span>
                        <span className="line-through">{totalWithoutDiscount} {selectedCurrency}</span>
                      </div>
                    )}
                    
                    {/* Total Savings */}
                    {totalSavings && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-green-600 dark:text-green-400 mb-1.5 sm:mb-2">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                          {t('language') === 'TR' ? 'Tasarruf' : 'Savings'}
                        </span>
                        <span className="font-semibold">-{totalSavings} {selectedCurrency}</span>
                      </div>
                    )}
                    
                    {/* Final Total - Prominent */}
                    <div className="flex items-center justify-between py-2 sm:py-3 bg-primary/10 rounded-lg px-2 sm:px-3 -mx-1 sm:-mx-2">
                      <span className="font-bold text-sm sm:text-base">{t('language') === 'TR' ? 'Toplam' : 'Total'}</span>
                      <span className="text-primary text-lg sm:text-xl font-bold">{totalPrice} {selectedCurrency}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Mobile Optimized */}
            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={handleConfirmVehicleSelection} 
                className="w-full h-12 sm:h-14 text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg" 
                size="lg"
                disabled={isLoading || !selectedVehicleForConfirm || (hasReturnTrip && (!returnTripData.date || !returnTripData.time))}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {t('language') === 'TR' ? 'Onayla ve Rezerve Et' : 'Confirm & Book'}
                  </>
                )}
              </Button>
              
              {/* Reject Price Button - Only show if prices exist and can reject */}
              {fetchedVehiclePrices.some(v => v.price) && canReject && !isDiscountedOffer && (
                <Button 
                  variant="outline"
                  onClick={handleRejectPrice}
                  className="w-full h-10 sm:h-12 text-sm border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
                  disabled={isRejecting || isLoading || !selectedVehicleForConfirm}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('language') === 'TR' ? 'İndirim Uygulanıyor...' : 'Applying Discount...'}</span>
                      <span className="sm:hidden">{t('language') === 'TR' ? 'Yükleniyor...' : 'Loading...'}</span>
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('language') === 'TR' ? 'Fiyat Yüksek, İndirim İste' : 'Price Too High, Request Discount'}</span>
                      <span className="sm:hidden">{t('language') === 'TR' ? 'İndirim İste' : 'Get Discount'}</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Discount Applied Badge - Show after discount with glow animation */}
              {isDiscountedOffer && appliedDiscountInfo && (
                <div 
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-5 rounded-xl",
                    "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40",
                    "border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
                    "shadow-[0_0_15px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(52,211,153,0.25)]",
                    discountJustApplied && "animate-[pulse-glow_2s_ease-in-out_infinite]"
                  )}
                  style={{
                    animation: discountJustApplied ? 'pulse-glow 2s ease-in-out infinite' : undefined
                  }}
                >
                  <style>{`
                    @keyframes pulse-glow {
                      0%, 100% { 
                        box-shadow: 0 0 15px rgba(16,185,129,0.3), 0 0 30px rgba(16,185,129,0.1);
                        transform: scale(1);
                      }
                      50% { 
                        box-shadow: 0 0 25px rgba(16,185,129,0.5), 0 0 50px rgba(16,185,129,0.2);
                        transform: scale(1.02);
                      }
                    }
                  `}</style>
                  <div className="flex items-center gap-2">
                    <Gift className={cn(
                      "h-5 w-5 text-green-600 dark:text-green-400",
                      discountJustApplied && "animate-bounce"
                    )} />
                    <span className="font-semibold text-base">
                      {t('language') === 'TR' ? 'Özel İndiriminiz Uygulandı!' : 'Your Special Discount Applied!'}
                    </span>
                    <CheckCircle className={cn(
                      "h-5 w-5 text-green-600 dark:text-green-400",
                      discountJustApplied && "animate-pulse"
                    )} />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/50 font-bold text-green-800 dark:text-green-200",
                      discountJustApplied && "animate-pulse"
                    )}>
                      <Tag className="h-3.5 w-3.5" />
                      -{appliedDiscountInfo.amount} {appliedDiscountInfo.currency}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 font-bold text-emerald-800 dark:text-emerald-200",
                      discountJustApplied && "animate-pulse"
                    )}>
                      <Sparkles className="h-3.5 w-3.5" />
                      %{appliedDiscountInfo.percentage} {t('language') === 'TR' ? 'İndirim' : 'Off'}
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowVehicleSelection(false);
                  setPendingFormData(null);
                  setPendingPassengerNames([]);
                  setFetchedVehiclePrices([]);
                  setCanReject(true);
                  setIsDiscountedOffer(false);
                  setDiscountJustApplied(false);
                  setPreviousVehiclePrices({});
                  setAppliedDiscountInfo(null);
                }}
                className="w-full"
                disabled={isLoading || isRejecting}
              >
                {t('language') === 'TR' ? 'Geri Dön' : 'Go Back'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary/60 py-8 px-4">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold">{t('reservationSubmitted')}</h2>
              <p className="text-muted-foreground">
                {t('reservationSubmittedDesc')}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-left space-y-2">
              <p className="text-sm"><strong>{t('route')}:</strong> {formData.pickup} → {formData.dropoff}</p>
              <p className="text-sm"><strong>{t('date')}:</strong> {formData.date} at {formData.time}</p>
              <p className="text-sm"><strong>{t('vehicle')}:</strong> {vehicleTypes.find(v => v.value === formData.vehicleType)?.label}</p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate('/customer/reservations')} 
                className="w-full" 
                size="lg"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t('myReservations')}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setPassengerNames(['']);
                  setFormData({
                    phone: formData.phone,
                    email: formData.email,
                    password: '',
                    pickup: '',
                    dropoff: '',
                    date: '',
                    paymentMethod: '',
                    time: '',
                    flightNumber: '',
                    vehicleType: 'mercedes-vito',
                    notes: '',
                    pickup_place_name: '',
                    pickup_lat: null,
                    pickup_lng: null,
                    dropoff_place_name: '',
                    dropoff_lat: null,
                    dropoff_lng: null,
                  });
                }} 
                className="w-full"
              >
                {t('bookAnotherTransfer')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate missing fields for pending reservation
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.email) missing.push(t('email') || 'Email');
    if (!formData.phone) missing.push(t('phone') || 'Phone');
    if (!passengerNames[0]?.trim()) missing.push(t('passengerName') || 'Passenger Name');
    if (!isLoggedIn && !formData.password) missing.push(t('password') || 'Password');
    return missing;
  };

  const missingFields = hasPendingReservation ? getMissingFields() : [];
  const showPendingBanner = hasPendingReservation && missingFields.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary/60 py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-serif">Meet Transfer</CardTitle>
          <CardDescription>{t('bookingFormSubtitle')}</CardDescription>
          
          {/* Pending Reservation Banner with MT Code */}
          {hasPendingReservation && pendingReservationCode && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-green-700 dark:text-green-300">
                  {t('reservationCreated') || 'Reservation Created!'}
                </p>
              </div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                {pendingReservationCode}
              </p>
              {returnReservationCode && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('returnTrip') || 'Return Trip'}: <span className="font-semibold">{returnReservationCode}</span>
                </p>
              )}
            </div>
          )}
          
          {/* Flashing Missing Fields Warning */}
          {showPendingBanner && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-pulse">
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                {t('completeYourInfo') || 'Please complete your information'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {missingFields.map((field, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 animate-bounce"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Details Section - Show as summary if pending reservation */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">{t('transferDetails')}</h3>
              
              {hasPendingReservation ? (
                /* Readonly summary for pending reservations */
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('pickupPoint')}</p>
                      <p className="font-medium">{formData.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dropoffLocation')}</p>
                      <p className="font-medium">{formData.dropoff}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('date')}</p>
                        <p className="font-medium">{formData.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('time')}</p>
                        <p className="font-medium">{formData.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('vehicle')}</p>
                        <p className="font-medium">{vehicleTypes.find(v => v.value === formData.vehicleType)?.label}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price display for pending reservation */}
                  {prefilledPrice && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t('price') || 'Price'}:</span>
                        <span className="text-xl font-bold text-primary">{prefilledPrice} {prefilledCurrency}</span>
                      </div>
                      {prefilledReturnPrice && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{t('returnTrip') || 'Return Trip'}:</span>
                          <span>{prefilledReturnPrice} {prefilledCurrency}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Editable form for new reservations */
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('pickupPoint')}
                    </Label>
                    <GooglePlacesAutocomplete
                      onPlaceSelected={(value, details) => setFormData((prev) => ({ 
                        ...prev, 
                        pickup: value,
                        pickup_place_name: details?.placeName || '',
                        pickup_lat: details?.lat || null,
                        pickup_lng: details?.lng || null,
                      }))}
                      placeholder={t('enterPickupPoint')}
                      className={errors.pickup ? 'border-destructive' : ''}
                      maxLength={200}
                      initialValue={formData.pickup}
                    />
                    {errors.pickup && <p className="text-sm text-destructive">{errors.pickup}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('dropoffLocation')}
                    </Label>
                    <GooglePlacesAutocomplete
                      onPlaceSelected={(value, details) => setFormData((prev) => ({ 
                        ...prev, 
                        dropoff: value,
                        dropoff_place_name: details?.placeName || '',
                        dropoff_lat: details?.lat || null,
                        dropoff_lng: details?.lng || null,
                      }))}
                      placeholder={t('hotelOrAddress')}
                      className={errors.dropoff ? 'border-destructive' : ''}
                      maxLength={200}
                      initialValue={formData.dropoff}
                    />
                    {errors.dropoff && <p className="text-sm text-destructive">{errors.dropoff}</p>}
                  </div>

                  {/* Route Map Preview */}
                  {formData.pickup && formData.dropoff && (
                    <div className="pt-4">
                      <GoogleRouteMap
                        pickup={formData.pickup}
                        dropoff={formData.dropoff}
                        showNavigationButtons={false}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
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
                      />
                      {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Flight
                      </Label>
                      <Input
                        placeholder="TK1234"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({...formData, flightNumber: e.target.value})}
                        maxLength={20}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Airline Display & Flight Status */}
              {formData.flightNumber && formData.flightNumber.length >= 2 && (
                <div className="space-y-3">
                  <AirlineDisplay flightNumber={formData.flightNumber} size="md" />
                  {formData.date && (
                    <FlightStatus 
                      flightNumber={formData.flightNumber} 
                      date={formData.date}
                      refreshIntervalMs={0}
                    />
                  )}
                </div>
              )}

              {/* Return Reservation Section */}
              {!hasReturnTrip ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setHasReturnTrip(true)}
                  disabled={!formData.pickup || !formData.dropoff}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  {t('returnTrip')}
                </Button>
              ) : (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-dashed space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      {t('returnTrip')}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHasReturnTrip(false);
                        setReturnTripData({ date: '', time: '', flightNumber: '' });
                        setPromoCode('');
                        setIsPromoCodeValid(null);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                    <span className="font-medium">{formData.dropoff || t('dropoffLocation')}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{formData.pickup || t('pickupPoint')}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('returnDate')}
                      </Label>
                      <Input
                        type="date"
                        value={returnTripData.date}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, date: e.target.value }))}
                        min={formData.date || new Date().toISOString().split('T')[0]}
                        className={errors.returnDate ? 'border-destructive' : ''}
                      />
                      {errors.returnDate && <p className="text-sm text-destructive">{errors.returnDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>{t('returnTime')}</Label>
                      <Input
                        type="time"
                        value={returnTripData.time}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, time: e.target.value }))}
                        className={errors.returnTime ? 'border-destructive' : ''}
                      />
                      {errors.returnTime && <p className="text-sm text-destructive">{errors.returnTime}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Flight
                      </Label>
                      <Input
                        placeholder="TK1234"
                        value={returnTripData.flightNumber}
                        onChange={(e) => setReturnTripData(prev => ({ ...prev, flightNumber: e.target.value }))}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {/* Promo Code Field */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {t('promoCode')}
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder={t('promoCodePlaceholder')}
                        value={promoCode}
                        onChange={(e) => handlePromoCodeChange(e.target.value)}
                        className={`pr-10 ${isPromoCodeValid === true ? 'border-green-500 focus-visible:ring-green-500' : isPromoCodeValid === false ? 'border-destructive' : ''}`}
                        maxLength={50}
                      />
                      {isPromoCodeValid === true && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {isPromoCodeValid === true && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('promoCodeSuccess')}
                      </p>
                    )}
                    {isPromoCodeValid === false && promoCode.trim() !== '' && (
                      <p className="text-sm text-destructive">{t('promoCodeInvalid')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Passengers Section */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">{t('passengers')}</h3>
              
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
                        placeholder={index === 0 ? t('primaryPassenger') : `${t('passengers')} ${index + 1}`}
                        value={name}
                        onChange={(e) => updatePassenger(index, e.target.value)}
                        className={index === 0 && errors.passengerNames ? 'border-destructive' : ''}
                        maxLength={100}
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="text-destructive hover:bg-destructive/10"
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
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('addPassenger')}
                  </Button>
                )}
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-lg">{t('contactDetails')}</h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('phone')}
                </Label>
                <Input
                  placeholder={t('phonePlaceholder')}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={errors.phone ? 'border-destructive' : ''}
                  maxLength={20}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('email')}
                </Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={errors.email ? 'border-destructive' : ''}
                  maxLength={255}
                  disabled={isLoggedIn}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Password field - only show if not logged in */}
              {!isLoggedIn && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('password')}
                    </Label>
                    <Input
                      type="password"
                      placeholder="Ab2215"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className={errors.password ? 'border-destructive' : ''}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      1 uppercase, 1 lowercase, 4+ digits (e.g., Ab2215)
                    </p>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t('priceInfoMessage')}
                    </p>
                  </div>

                  {/* Google login - only show if NOT from quick booking */}
                  {!isFromQuickBooking && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                              redirectTo: `${window.location.origin}/book/complete`,
                            },
                          });
                          if (error) {
                            toast.error('Google sign-in failed');
                          }
                        }}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        {t('googleSignIn')}
                      </Button>
                    </>
                  )}
                </>
              )}

              {isLoggedIn && (
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg text-sm text-green-700 dark:text-green-300">
                  Logged in as {formData.email}
                </div>
              )}
            </div>

            {/* Vehicle & Payment Section */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {t('vehicleType')}
                </Label>
                
                {/* Price not found warning - only show for QuickBooking flow */}
                {isFromQuickBooking && !isPricesLoading && Object.keys(vehiclePrices).length === 0 && urlPickup && urlDropoff && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                    <Coins className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {t('language') === 'TR' 
                          ? 'Bu güzergah için otomatik fiyat bulunamadı' 
                          : 'No automatic pricing found for this route'}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 mt-1">
                        {t('language') === 'TR'
                          ? 'Rezervasyon onaylandıktan sonra fiyat bilgisi tarafınıza iletilecektir.'
                          : 'Price will be provided after your reservation is confirmed.'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4">
                  {vehicleTypes.map(vehicle => {
                    // For logged-in users NOT coming from QuickBooking, don't show prices in main form
                    // Price will be shown after form submission in vehicle selection screen
                    const showPriceInMainForm = isFromQuickBooking;
                    const vehiclePrice = showPriceInMainForm ? (vehiclePrices[vehicle.value] || null) : null;
                    return (
                      <VehicleSelectionCard
                        key={vehicle.value}
                        vehicleType={vehicle.value}
                        isSelected={formData.vehicleType === vehicle.value}
                        onSelect={(v) => setFormData({...formData, vehicleType: v})}
                        price={vehiclePrice}
                        currency={prefilledCurrency}
                        showPrice={showPriceInMainForm}
                        isRecommended={isFromQuickBooking && vehicle.value === formData.vehicleType && !!vehiclePrice}
                        isLoading={isFromQuickBooking && isPricesLoading}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Payment Option Section */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-4 w-4" />
                  {t('paymentMethod')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('priceInfoMessage')}
                </p>
                <RadioGroup 
                  value={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v as 'payment_link' | 'cash'})}
                >
                  <div className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${errors.paymentMethod ? 'border-destructive' : ''}`}>
                    <RadioGroupItem value="payment_link" id="payment_link" />
                    <div className="flex-1">
                      <Label htmlFor="payment_link" className="cursor-pointer font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        {t('onlinePaymentLink')}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('priceInfoMessage')}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${errors.paymentMethod ? 'border-destructive' : ''}`}>
                    <RadioGroupItem value="cash" id="cash" />
                    <div className="flex-1">
                      <Label htmlFor="cash" className="cursor-pointer font-medium flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        {t('cashToDriver')}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('priceInfoMessage')}
                      </p>
                    </div>
                  </div>
                </RadioGroup>
                {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod}</p>}
              </div>

              {/* Luggage & Baby Seat Display - from CustomerHome form */}
              {(luggageCount > 0 || babySeatCount > 0) && (
                <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                  {luggageCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Luggage className="h-4 w-4 text-orange-500" />
                      <span>{luggageCount} {t('luggage') || 'Luggage'}</span>
                    </div>
                  )}
                  {babySeatCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Baby className="h-4 w-4 text-pink-500" />
                      <span>{babySeatCount} {t('babySeat') || 'Baby Seat'}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('specialRequests') || 'Notes'} ({t('optional') || 'optional'})</Label>
                <Textarea
                  placeholder={t('specialRequestsPlaceholder') || "Special requests, additional info..."}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Coins className="h-4 w-4 text-primary" />
                {t("preferredCurrency") || "Preferred Currency"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("currencyHint") || "Select your preferred currency for the price quote"}
              </p>
              <div className="flex flex-wrap gap-2">
                {currencyOptions.map((currency) => (
                  <button
                    key={currency.value}
                    type="button"
                    onClick={() => setPreferredCurrency(currency.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm border",
                      preferredCurrency === currency.value
                        ? "bg-primary text-primary-foreground shadow-md scale-105 border-primary"
                        : "bg-background text-foreground hover:bg-muted border-border"
                    )}
                  >
                    <span>{currency.flag}</span>
                    <span>{currency.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {t('priceInfoMessage')}
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? t('submitting') : t('submitBookingRequest')}
            </Button>

            {!isLoggedIn && (
              <p className="text-center text-sm text-muted-foreground">
                {t('alreadyHaveAccount')}{' '}
                <a href="/auth" className="text-primary hover:underline">{t('loginHere')}</a>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationForm;
