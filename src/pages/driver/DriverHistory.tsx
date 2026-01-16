import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, User, Car, CreditCard, CheckCircle2, Loader2, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationDisplay } from '@/components/ui/location-display';
import { getCurrencySymbol } from '@/lib/currency';

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes-vito',
  'vip-mercedes': 'Vip Mercedes',
  'maybach-minibus': 'Mercedes Maybach Minivan',
  'minibus': 'Minibus',
  // Legacy support
  'mercedes-vclass': 'Vip Mercedes',
  'maybach': 'Mercedes Maybach Minivan',
};

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  payment_type: string;
  price: number | null;
  price_currency: string | null;
  driver_earning: number | null; // Şoför maliyeti (TRY)
  status: string;
  driver_cash_amount: number | null; // Şoförün aldığı nakit (TRY)
}


const paymentTypeLabels: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart',
  online: 'Online',
  none: 'Yok',
};

const DriverHistory = () => {
  const navigate = useNavigate();
  const { driverId } = useUserRole();
  const { t, getPaymentTypeLabel } = useDriverTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()));
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null || price === undefined) return '-';
    return `${getCurrencySymbol(currency)}${price.toLocaleString('tr-TR')}`;
  };

  const fetchHistory = async () => {
    if (!driverId) return;
    setLoading(true);

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .order('pickup_date', { ascending: false })
      .order('pickup_time', { ascending: false });

    if (dateFrom) {
      query = query.gte('pickup_date', format(dateFrom, 'yyyy-MM-dd'));
    }
    if (dateTo) {
      query = query.lte('pickup_date', format(dateTo, 'yyyy-MM-dd'));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (driverId) {
      fetchHistory();
    }
  }, [driverId, dateFrom, dateTo]);

  // Calculate totals - TL bazlı (driver_earning ve driver_cash_amount)
  const totalTrips = reservations.length;
  const totalEarnings = reservations.reduce((sum, r) => sum + (r.driver_earning || 0), 0);
  const totalCashCollected = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center gap-3 sticky top-0 z-20 shadow-lg">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/driver')} 
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-serif font-bold flex-1">{t('transferHistory')}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9",
            showFilters && "bg-primary-foreground/20"
          )}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </header>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-muted border-b"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('filterByDate')}</span>
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    {t('clear')}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal h-10",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PP', { locale: tr }) : t('startDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal h-10",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PP', { locale: tr }) : t('endDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalTrips}</p>
            <p className="text-xs text-muted-foreground">{t('totalTransfers')}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">₺{totalEarnings.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-muted-foreground">{t('earnings')}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">₺{totalCashCollected.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-muted-foreground">{t('cashCollected')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trip List */}
      <main className="px-4 pb-8 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noCompletedTransfers')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateFrom || dateTo ? t('tryChangingFilters') : t('completedTransfersWillAppear')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-green-500"
                  onClick={() => navigate(`/driver/job/${reservation.id}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(reservation.pickup_date), 'EEE, d MMM yyyy', { locale: tr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.pickup_time}</span>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.customer_name}</span>
                    </div>

                    {/* Route */}
                    <div className="bg-muted/50 rounded-lg p-2 space-y-2">
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

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          <span>{vehicleTypeLabels[reservation.vehicle_type] || reservation.vehicle_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{getPaymentTypeLabel(reservation.payment_type)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {reservation.driver_cash_amount && reservation.driver_cash_amount > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            {t('cash')}: {formatPrice(reservation.driver_cash_amount, 'TRY')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverHistory;
