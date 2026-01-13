import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Clock, MapPin, Users, Car, Search, Filter, X, CalendarIcon, ChevronRight, Share2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { WHATSAPP_NUMBER, getWhatsAppUrl } from '@/lib/contact';

interface Booking {
  id: string;
  booking_type: string;
  pickup_location: string;
  dropoff_location: string | null;
  pickup_date: string;
  pickup_time: string;
  passengers: number;
  vehicle_type: string;
  passenger_name: string;
  status: string;
  created_at: string;
}

interface Filters {
  searchQuery: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          booking.pickup_location?.toLowerCase().includes(query) ||
          booking.dropoff_location?.toLowerCase().includes(query) ||
          booking.passenger_name?.toLowerCase().includes(query) ||
          booking.vehicle_type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && booking.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const bookingDate = new Date(booking.pickup_date);
        if (bookingDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const bookingDate = new Date(booking.pickup_date);
        if (bookingDate > filters.dateTo) return false;
      }

      return true;
    });
  }, [bookings, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
    };
    return labels[status] || status;
  };

  // WhatsApp sharing for booking
  const getBookingDetailsText = (booking: Booking) => {
    const formattedDate = format(new Date(booking.pickup_date), 'dd MMM yyyy', { locale: tr });
    
    const lines = [
      `🚖 *REZERVASYONUM*`,
      `━━━━━━━━━━━━━━━━━`,
      ``,
      `📅 *Tarih:* ${formattedDate}`,
      `🕐 *Saat:* ${booking.pickup_time}`,
      ``,
      `🟢 *Alış Noktası:*`,
      booking.pickup_location,
      ``,
      booking.dropoff_location ? `🔴 *Varış Noktası:*` : null,
      booking.dropoff_location || null,
      booking.dropoff_location ? `` : null,
      `👥 *Yolcu:* ${booking.passengers}`,
      `🚗 *Araç:* ${booking.vehicle_type}`,
      `📋 *Durum:* ${getStatusLabel(booking.status)}`,
      ``,
      `━━━━━━━━━━━━━━━━━`,
    ].filter(Boolean).join('\n');

    return lines;
  };

  const copyBookingDetails = async (booking: Booking) => {
    const text = getBookingDetailsText(booking);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Rezervasyon detayları kopyalandı');
    } catch (err) {
      toast.error('Kopyalama başarısız');
    }
  };

  const shareViaWhatsApp = (booking: Booking) => {
    const text = getBookingDetailsText(booking);
    window.open(getWhatsAppUrl(text), '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Rezervasyonlarım</h1>
          <p className="text-muted-foreground font-sans">Transfer rezervasyonlarınızı görüntüleyin ve yönetin</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Konum, isim veya araç ara..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle Button */}
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtreler
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durum</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="confirmed">Onaylandı</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="cancelled">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, 'dd MMM yyyy', { locale: tr }) : 'Tarih seç'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, 'dd MMM yyyy', { locale: tr }) : 'Tarih seç'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" onClick={clearFilters} className="gap-2 text-destructive hover:text-destructive">
                      <X className="h-4 w-4" />
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Active Filter Tags */}
            {!showFilters && activeFiltersCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Durum: {getStatusLabel(filters.status)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, status: 'all' })}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    Başlangıç: {format(filters.dateFrom, 'dd MMM yyyy', { locale: tr })}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, dateFrom: undefined })}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    Bitiş: {format(filters.dateTo, 'dd MMM yyyy', { locale: tr })}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, dateTo: undefined })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredBookings.length} rezervasyon bulundu
            {activeFiltersCount > 0 && ` (toplam ${bookings.length})`}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {bookings.length === 0 ? (
                <>
                  <p className="text-muted-foreground font-sans mb-4">Henüz rezervasyon bulunamadı</p>
                  <a href="/" className="text-primary hover:underline font-sans">
                    İlk rezervasyonunuzu yapın
                  </a>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground font-sans mb-4">Filtrelere uygun rezervasyon bulunamadı</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Filtreleri Temizle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-display text-xl">
                        {booking.booking_type === 'airport' ? 'Havalimanı Transferi' : 'Saatlik Hizmet'}
                      </CardTitle>
                      <CardDescription className="font-sans">
                        {new Date(booking.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(booking.pickup_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{booking.pickup_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{booking.pickup_location}</span>
                      </div>
                      {booking.dropoff_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>→ {booking.dropoff_location}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{booking.passengers} yolcu</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="capitalize">{booking.vehicle_type}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Share Actions */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyBookingDetails(booking)}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Kopyala
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareViaWhatsApp(booking)}
                      className="gap-2 text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Bookings;
