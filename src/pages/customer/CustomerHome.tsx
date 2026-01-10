import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Bookmark, TrendingUp
} from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/NotificationBell';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { PhoneInput } from '@/components/ui/phone-input';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { VEHICLE_TYPE_OPTIONS as vehicleTypes } from '@/lib/vehicleTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language } from '@/contexts/LanguageContext';
import meetTransferLogo from '@/assets/meet-transfer-logo-small.webp';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/agency/PullToRefreshIndicator';

// Language options
const LANGUAGES = [
  { code: "EN" as Language, label: "English", flag: "🇬🇧" },
  { code: "TR" as Language, label: "Türkçe", flag: "🇹🇷" },
  { code: "DE" as Language, label: "Deutsch", flag: "🇩🇪" },
  { code: "FR" as Language, label: "Français", flag: "🇫🇷" },
  { code: "RU" as Language, label: "Русский", flag: "🇷🇺" },
  { code: "AR" as Language, label: "العربية", flag: "🇸🇦" },
] as const;

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
const WHATSAPP_NUMBER = '905321748390';
const EMERGENCY_PHONE = '+905321748390';

// Helper function - outside component for better performance
const getGreeting = (language: string): string => {
  const hour = new Date().getHours();
  if (language === 'TR') {
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const CustomerHome = () => {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  
  // State - organized by purpose
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [nextTransfer, setNextTransfer] = useState<{date: string; time: string; pickup: string; dropoff: string; reservationCode?: string} | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '', phone: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{pickup: string; dropoff: string}[]>([]);
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    flightNumber: '',
    passengerPhone: '',
    vehicleType: 'mercedes-vito',
    paymentType: 'cash',
  });

  // Memoized greeting
  const greeting = useMemo(() => getGreeting(language), [language]);

  // Memoized display name
  const displayName = useMemo(() => {
    return profileData.full_name || user?.email?.split('@')[0] || (language === 'TR' ? 'Değerli Müşterimiz' : 'Valued Customer');
  }, [profileData.full_name, user?.email, language]);

  // Fetch data function - extracted for refresh capability
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsRefreshing(true);
    try {
      // Fetch active bookings with next transfer info
      const { data: activeReservations, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .eq('customer_id', user.id)
        .in('status', ['awaiting-price', 'waiting_for_customer_approval', 'customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review'])
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .limit(1);
      
      setActiveBookingsCount(count || 0);
      
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
        // Auto-fill phone if empty
        if (!formData.passengerPhone && profile.phone) {
          setFormData(prev => ({ ...prev, passengerPhone: profile.phone || '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, formData.passengerPhone]);

  // Pull to refresh handler
  const handlePullToRefresh = useCallback(async () => {
    await fetchData();
    toast.success(language === 'TR' ? 'Yenilendi!' : 'Refreshed!');
  }, [fetchData, language]);

  const { pullDistance, isRefreshing: isPullRefreshing, isPulling, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handlePullToRefresh,
    threshold: 80,
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      toast.success(language === 'TR' ? 'Profil güncellendi' : 'Profile updated');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
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

    const validPassengerNames = passengerNames.filter(name => name.trim() !== '');
    if (validPassengerNames.length === 0) {
      setErrors({ passengerNames: t('passengerRequired') });
      toast.error(t('passengerRequired'));
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

    // Redirect to ReservationForm with all form data as URL params - same flow as quick booking
    const params = new URLSearchParams({
      pickup: result.data.pickup,
      dropoff: result.data.dropoff.trim(),
      date: result.data.date,
      time: result.data.time,
      vehicleType: result.data.vehicleType,
      passengers: String(validPassengerNames.length),
      paymentMethod: result.data.paymentType,
    });
    
    if (result.data.flightNumber) {
      params.set('flightNumber', result.data.flightNumber.trim());
    }

    // Store passenger names in sessionStorage for the reservation form to pick up
    sessionStorage.setItem('customerPassengerNames', JSON.stringify(validPassengerNames));
    sessionStorage.setItem('customerPhone', result.data.passengerPhone.trim());

    navigate(`/reservation?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header with Logo & Language */}
      <header className="bg-primary text-primary-foreground py-3 px-3 sm:py-4 sm:px-6 sticky top-0 z-10 safe-area-inset-top shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-primary-foreground/20"
            />
            <span className="text-lg sm:text-xl font-serif font-bold">Meet Transfer</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Selector in Header */}
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="w-auto gap-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 h-8 sm:h-9 px-2 text-sm">
                <Globe className="h-4 w-4" />
                <SelectValue>
                  {LANGUAGES.find((l) => l.code === language)?.flag}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <NotificationBell />
          
          {/* Settings Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10"
              >
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {language === 'TR' ? 'Ayarlar' : 'Settings'}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Profile Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {language === 'TR' ? 'Profil Bilgileri' : 'Profile Info'}
                      </CardTitle>
                      {!isEditingProfile ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditingProfile(true)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditingProfile(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                          >
                            <Save className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {language === 'TR' ? 'Ad Soyad' : 'Full Name'}
                      </Label>
                      {isEditingProfile ? (
                        <Input
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          placeholder={language === 'TR' ? 'Adınız Soyadınız' : 'Your Name'}
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {profileData.full_name || (language === 'TR' ? 'Belirtilmemiş' : 'Not specified')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {language === 'TR' ? 'Telefon' : 'Phone'}
                      </Label>
                      {isEditingProfile ? (
                        <PhoneInput
                          value={profileData.phone}
                          onChange={(value) => setProfileData({ ...profileData, phone: value })}
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {profileData.phone || (language === 'TR' ? 'Belirtilmemiş' : 'Not specified')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium">{user?.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Selector */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {language === 'TR' ? 'Dil Seçimi' : 'Language'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {LANGUAGES.find((l) => l.code === language)?.flag} {LANGUAGES.find((l) => l.code === language)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <NotificationSettingsPanel language={language === 'TR' ? 'TR' : 'EN'} />

                {/* WhatsApp Support */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50"
                  onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(language === 'TR' ? 'Merhaba, destek almak istiyorum.' : 'Hello, I need support.'), '_blank')}
                >
                  <span className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <MessageCircle className="h-4 w-4" />
                    {language === 'TR' ? 'WhatsApp Destek' : 'WhatsApp Support'}
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
                    {language === 'TR' ? 'Acil Durum Hattı' : 'Emergency Hotline'}
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 font-mono">{EMERGENCY_PHONE.replace('+90', '+90 ')}</span>
                </Button>

                {/* Security Settings */}
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => navigate('/security-settings')}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {language === 'TR' ? 'Güvenlik Ayarları' : 'Security Settings'}
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
                  {language === 'TR' ? 'Çıkış Yap' : 'Sign Out'}
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
        {/* Welcome Section with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <h2 className="text-lg sm:text-xl font-medium text-muted-foreground">
                {greeting},
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {displayName}
          </h1>
        </motion.div>

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
                            {language === 'TR' ? 'Yaklaşan Transferiniz' : 'Your Next Transfer'}
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

        {/* Quick Actions Grid with Stagger Animation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* New Reservation Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative"
              onClick={() => {
                const formElement = document.getElementById('booking-form');
                formElement?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[110px] relative z-10">
                <div className="bg-primary-foreground/20 rounded-full p-2.5 mb-2 backdrop-blur-sm">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-semibold text-sm">
                  {language === 'TR' ? 'Yeni Rezervasyon' : 'New Reservation'}
                </span>
                <span className="text-xs opacity-80 mt-1">
                  {language === 'TR' ? 'Hemen başla' : 'Start now'}
                </span>
              </CardContent>
            </Card>
          </motion.div>

          {/* My Bookings Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer shadow-md hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-br from-background to-muted/50"
              onClick={() => navigate('/customer/bookings')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[110px]">
                <div className="bg-primary/10 rounded-full p-2.5 mb-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold text-sm">
                  {language === 'TR' ? 'Rezervasyonlarım' : 'My Bookings'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {activeBookingsCount > 0 
                    ? (language === 'TR' ? `${activeBookingsCount} aktif` : `${activeBookingsCount} active`)
                    : (language === 'TR' ? 'Görüntüle' : 'View all')}
                </span>
                {activeBookingsCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 shadow-lg">
                      {activeBookingsCount}
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Support & Navigation Actions - Same Design as CustomerBookings */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-4 gap-2 mb-6"
        >
          {/* Home */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">
                {language === 'TR' ? 'Anasayfa' : 'Home'}
              </span>
            </Button>
          </motion.div>
          
          {/* WhatsApp */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/40"
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(language === 'TR' ? 'Merhaba, destek almak istiyorum.' : 'Hello, I need support.'), '_blank')}
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs font-medium">
                WhatsApp
              </span>
            </Button>
          </motion.div>
          
          {/* Emergency Call */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 hover:border-red-500/40"
              onClick={() => window.open(`tel:${EMERGENCY_PHONE}`, '_self')}
            >
              <PhoneCall className="h-5 w-5 text-red-500" />
              <span className="text-xs font-medium">
                {language === 'TR' ? 'Acil' : 'Call'}
              </span>
            </Button>
          </motion.div>
          
          {/* Security */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
              onClick={() => navigate('/security-settings')}
            >
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-medium">
                {language === 'TR' ? 'Güvenlik' : 'Security'}
              </span>
            </Button>
          </motion.div>
        </motion.div>

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
                {language === 'TR' ? 'Son Aramalar' : 'Recent Searches'}
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
                    const formElement = document.getElementById('booking-form');
                    formElement?.scrollIntoView({ behavior: 'smooth' });
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

        {/* Booking Form with Enhanced Styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card id="booking-form" className="scroll-mt-20 shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-serif flex items-center gap-2">
              <Car className="h-5 w-5 sm:h-6 sm:w-6" />
              {t('bookYourTransfer')}
            </CardTitle>
            <CardDescription>
              {t('submitTransferDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                />
                {errors.dropoff && <p className="text-sm text-destructive">{errors.dropoff}</p>}
              </div>

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
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removePassenger(index)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
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
                />
                {errors.passengerPhone && <p className="text-sm text-destructive">{errors.passengerPhone}</p>}
              </div>

              {/* Vehicle Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {t('vehicleType')}
                </Label>
                <RadioGroup value={formData.vehicleType} onValueChange={(v) => setFormData({...formData, vehicleType: v})}>
                  {vehicleTypes.map(vehicle => (
                    <div key={vehicle.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={vehicle.value} id={vehicle.value} />
                      <Label htmlFor={vehicle.value} className="cursor-pointer flex-1">{vehicle.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Payment Type */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('paymentType')}
                </Label>
                <RadioGroup value={formData.paymentType} onValueChange={(v) => setFormData({...formData, paymentType: v})}>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer">{t('cashToDriver')}</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="cursor-pointer">{t('onlinePaymentLink')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Info message */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg text-center border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary text-sm">
                    {language === 'TR' ? 'En İyi Fiyat Garantisi' : 'Best Price Guarantee'}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t('priceApprovalMessage')}
                </p>
              </div>

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
        </Card>
        </motion.div>

        {/* Sticky FABs */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
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
                  const message = encodeURIComponent(
                    language === 'TR' 
                      ? 'Merhaba, destek almak istiyorum.' 
                      : 'Hello, I would like to get support.'
                  );
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
                }}
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg bg-[#25D366] hover:bg-[#22c55e] text-white"
                title={language === 'TR' ? 'WhatsApp Destek' : 'WhatsApp Support'}
              >
                <MessageCircle className="h-5 w-5" />
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
                className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                title={language === 'TR' ? 'Rezervasyonlarım' : 'My Bookings'}
              >
                <ClipboardList className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CustomerHome;
