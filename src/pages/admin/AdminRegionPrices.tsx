import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Search, MapPin, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';
import { testPriceMatch, MatchResult } from '@/lib/priceMatching';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Türkiye şehirleri ve havalimanları
const CITIES_DATA = {
  'Istanbul': {
    airports: ['Istanbul Airport (IST)', 'Sabiha Gokcen Airport (SAW)'],
    districts: ['Taksim', 'Sultanahmet', 'Kadikoy', 'Besiktas', 'Sisli', 'Fatih', 'Beyoglu', 'Uskudar', 'Bakirkoy', 'Atasehir', 'Maltepe', 'Pendik', 'Kartal', 'Sariyer', 'Zeytinburnu', 'Mecidiyekoy', 'Levent', 'Maslak', 'Yenikoy', 'Bebek', 'Ortakoy', 'Nisantasi', 'Cihangir', 'Galata', 'Karakoy', 'Eminonu', 'Balat', 'Eyup', 'Sile', 'Buyukcekmece', 'Beylikduzu', 'Avcilar', 'Arnavutkoy', 'Catalca', 'Silivri', 'Bagcilar', 'Bahcelievler', 'Gungoren', 'Esenler', 'Gaziosmanpasa', 'Sultangazi', 'Kucukcekmece', 'Esenyurt', 'Basaksehir', 'Kartal', 'Tuzla', 'Cekmekoy', 'Sancaktepe', 'Sultanbeyli', 'Beykoz']
  },
  'Antalya': {
    airports: ['Antalya Airport (AYT)'],
    districts: ['Kaleici', 'Konyaalti', 'Lara', 'Belek', 'Side', 'Alanya', 'Kemer', 'Kas', 'Kalkan', 'Fethiye', 'Manavgat', 'Serik', 'Kundu', 'Beldibi', 'Goynuk', 'Tekirova', 'Cirali', 'Olympos', 'Kadriye', 'Bogazkent', 'Kumkoy', 'Colakli', 'Evrenseki', 'Titreyengol', 'Mahmutlar', 'Okurcalar', 'Avsallar', 'Konakli', 'Incekum', 'Demre', 'Finike', 'Kumluca', 'Elmali', 'Akseki', 'Gazipasa', 'Korkuteli']
  },
  'Bodrum': {
    airports: ['Bodrum-Milas Airport (BJV)'],
    districts: ['Bodrum Center', 'Yalikavak', 'Turgutreis', 'Gumbet', 'Bitez', 'Ortakent', 'Turkbuku', 'Golturkbuku', 'Gumusluk', 'Akyarlar', 'Gundogan', 'Kadikalesi', 'Torba', 'Gulluk', 'Konacik', 'Mumcular', 'Aspat', 'Camel Beach', 'Paradise Bay', 'Pedasa']
  },
  'Dalaman': {
    airports: ['Dalaman Airport (DLM)'],
    districts: ['Dalaman Center', 'Fethiye', 'Oludeniz', 'Hisaronu', 'Ovacik', 'Calis', 'Gocek', 'Dalyan', 'Koycegiz', 'Marmaris', 'Icmeler', 'Turunc', 'Akyaka', 'Ortaca', 'Seydikemer', 'Kayakoy', 'Saklikent', 'Patara', 'Kalkan', 'Kas', 'Kaya', 'Uzumlu', 'Sarigerme', 'Ekincik']
  },
  'Izmir': {
    airports: ['Izmir Adnan Menderes Airport (ADB)'],
    districts: ['Konak', 'Karsiyaka', 'Bornova', 'Buca', 'Alsancak', 'Cesme', 'Alacati', 'Urla', 'Seferihisar', 'Kusadasi', 'Selcuk', 'Ephesus', 'Sirince', 'Dikili', 'Foca', 'Bergama', 'Odemis', 'Tire', 'Bayindir', 'Kemalpasa', 'Menemen', 'Aliaga', 'Cigli', 'Balcova', 'Narlidere', 'Guzelbahce', 'Gaziemir', 'Karabaglar', 'Bayrakli', 'Ildir', 'Dalyan', 'Mordogan']
  },
  'Cappadocia': {
    airports: ['Kayseri Airport (ASR)', 'Nevsehir-Kapadokya Airport (NAV)'],
    districts: ['Goreme', 'Urgup', 'Uchisar', 'Avanos', 'Ortahisar', 'Cavusin', 'Zelve', 'Pasabag', 'Devrent', 'Nevsehir', 'Kayseri', 'Derinkuyu', 'Kaymakli', 'Ihlara', 'Guzelyurt', 'Mustafapasa', 'Ibrahimpasa', 'Soganli']
  },
  'Bursa': {
    airports: ['Bursa Yenisehir Airport (YEI)'],
    districts: ['Osmangazi', 'Nilufer', 'Yildirim', 'Mudanya', 'Gemlik', 'Inegol', 'Orhangazi', 'Iznik', 'Cumalikizik', 'Uludag', 'Kestel', 'Gursu', 'Karacabey', 'Mustafakemalpasa', 'Yenisehir']
  },
  'Dubai': {
    airports: ['Dubai International Airport (DXB)', 'Al Maktoum International Airport (DWC)'],
    districts: ['Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'JBR', 'Deira', 'Bur Dubai', 'Business Bay', 'DIFC', 'Jumeirah', 'Jumeirah Beach', 'Al Barsha', 'Dubai Hills', 'Emirates Hills', 'Arabian Ranches', 'Dubai Creek', 'Al Quoz', 'JLT', 'Motor City', 'Sports City', 'Al Maryah', 'Dubai Silicon Oasis', 'Academic City', 'Dubai Production City', 'Dubailand']
  },
  'Cyprus': {
    airports: ['Larnaca Airport (LCA)', 'Paphos Airport (PFO)', 'Ercan Airport (ECN)'],
    districts: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta', 'Kyrenia', 'Ayia Napa', 'Protaras', 'Paralimni', 'Polis', 'Coral Bay', 'Latchi', 'Troodos', 'Platres', 'Lefkara', 'Kakopetria', 'Kourion', 'Kolossi', 'Pissouri', 'Pervolia', 'Voroklini', 'Oroklini', 'Dekelia', 'Mazotos', 'Zygi']
  }
};

const VEHICLE_TYPES = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-sprinter', label: 'Mercedes Sprinter' },
  { value: 'mercedes-maybach', label: 'Mercedes Maybach' },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'TRY', label: '₺ TRY' },
  { value: 'GBP', label: '£ GBP' },
];

interface RegionPrice {
  id: string;
  city: string;
  airport: string | null;
  district: string;
  vehicle_type: string;
  price: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
}

const AdminRegionPrices = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<RegionPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<RegionPrice | null>(null);
  
  // Form state
  const [formCity, setFormCity] = useState('');
  const [formAirport, setFormAirport] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formVehicleType, setFormVehicleType] = useState('mercedes-vito');
  const [formPrice, setFormPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('EUR');
  const [saving, setSaving] = useState(false);
  
  // Test state
  const [testPickup, setTestPickup] = useState('');
  const [testDropoff, setTestDropoff] = useState('');
  const [testVehicle, setTestVehicle] = useState('mercedes-vito');
  const [testResult, setTestResult] = useState<{
    result: MatchResult;
    analysis: {
      pickup: { airport: string | null; city: string | null; district: string | null };
      dropoff: { airport: string | null; city: string | null; district: string | null };
    };
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('region_prices')
        .select('*')
        .order('city', { ascending: true })
        .order('district', { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Fiyatlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCity('');
    setFormAirport('');
    setFormDistrict('');
    setFormVehicleType('mercedes-vito');
    setFormPrice('');
    setFormCurrency('EUR');
    setEditingPrice(null);
  };

  const openEditDialog = (price: RegionPrice) => {
    setEditingPrice(price);
    setFormCity(price.city);
    setFormAirport(price.airport || '');
    setFormDistrict(price.district);
    setFormVehicleType(price.vehicle_type);
    setFormPrice(price.price.toString());
    setFormCurrency(price.price_currency);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const priceValue = parseFloat(formPrice) || 0;
    if (!formCity || !formDistrict || priceValue <= 0) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const priceData = {
        city: formCity,
        airport: formAirport || null,
        district: formDistrict,
        vehicle_type: formVehicleType,
        price: priceValue,
        price_currency: formCurrency,
        is_active: true,
      };

      if (editingPrice) {
        const { error } = await supabase
          .from('region_prices')
          .update(priceData)
          .eq('id', editingPrice.id);

        if (error) throw error;
        toast.success('Fiyat güncellendi');
      } else {
        const { error } = await supabase
          .from('region_prices')
          .insert([priceData]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Bu kombinasyon için fiyat zaten mevcut');
            return;
          }
          throw error;
        }
        toast.success('Fiyat eklendi');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPrices();
    } catch (error) {
      console.error('Error saving price:', error);
      toast.error('Fiyat kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('region_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fiyat silindi');
      fetchPrices();
    } catch (error) {
      console.error('Error deleting price:', error);
      toast.error('Fiyat silinirken hata oluştu');
    }
  };

  const getVehicleLabel = (type: string) => {
    return VEHICLE_TYPES.find(v => v.value === type)?.label || type;
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺',
      'GBP': '£',
    };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = 
      price.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (price.airport && price.airport.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = filterCity === 'all' || price.city === filterCity;
    
    return matchesSearch && matchesCity;
  });

  const availableAirports = formCity ? (CITIES_DATA as any)[formCity]?.airports || [] : [];
  const availableDistricts = formCity ? (CITIES_DATA as any)[formCity]?.districts || [] : [];
  
  const handleTest = async () => {
    if (!testPickup || !testDropoff) {
      toast.error('Alış ve bırakış konumlarını girin');
      return;
    }
    
    setTesting(true);
    try {
      const result = await testPriceMatch(testPickup, testDropoff, testVehicle);
      setTestResult(result);
      
      if (result.result.found) {
        toast.success(`Fiyat bulundu: ${formatPrice(result.result.price!, result.result.currency!)}`);
      } else {
        toast.warning('Bu güzergah için fiyat bulunamadı');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test sırasında hata oluştu');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/admin')} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-serif">Bölge Fiyatları</h1>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
        {/* Test Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTube className="h-5 w-5" />
              Fiyat Eşleştirme Testi
            </CardTitle>
            <CardDescription>
              Google Maps'ten alış ve bırakış konumlarını yapıştırarak otomatik fiyat eşleştirmesini test edin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-1">
                <Label>Alış Konumu</Label>
                <Input
                  placeholder="Istanbul Airport (IST), Turkey"
                  value={testPickup}
                  onChange={(e) => setTestPickup(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>Bırakış Konumu</Label>
                <Input
                  placeholder="Taksim Square, Istanbul"
                  value={testDropoff}
                  onChange={(e) => setTestDropoff(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Araç Tipi</Label>
                <Select value={testVehicle} onValueChange={setTestVehicle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(v => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleTest} disabled={testing} className="w-full">
                  {testing ? 'Test Ediliyor...' : 'Test Et'}
                </Button>
              </div>
            </div>
            
            {testResult && (
              <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  {testResult.result.found ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.result.found ? 'Fiyat Bulundu' : 'Fiyat Bulunamadı'}
                  </span>
                  {testResult.result.confidence && (
                    <Badge variant={
                      testResult.result.confidence === 'high' ? 'default' :
                      testResult.result.confidence === 'medium' ? 'secondary' : 'outline'
                    }>
                      {testResult.result.confidence === 'high' ? 'Yüksek Güven' :
                       testResult.result.confidence === 'medium' ? 'Orta Güven' : 'Düşük Güven'}
                    </Badge>
                  )}
                </div>
                
                {testResult.result.found && (
                  <div className="grid gap-2 md:grid-cols-2 mb-3">
                    <div>
                      <span className="text-muted-foreground text-sm">Fiyat:</span>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(testResult.result.price!, testResult.result.currency!)}
                      </p>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Şehir:</span> {testResult.result.matchedCity}</p>
                      <p><span className="text-muted-foreground">İlçe:</span> {testResult.result.matchedDistrict}</p>
                      {testResult.result.matchedAirport && (
                        <p><span className="text-muted-foreground">Havalimanı:</span> {testResult.result.matchedAirport}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div className="p-2 rounded bg-background">
                    <p className="font-medium text-muted-foreground mb-1">Alış Analizi:</p>
                    <p>Havalimanı: {testResult.analysis.pickup.airport || <span className="text-muted-foreground">-</span>}</p>
                    <p>Şehir: {testResult.analysis.pickup.city || <span className="text-muted-foreground">-</span>}</p>
                    <p>İlçe: {testResult.analysis.pickup.district || <span className="text-muted-foreground">-</span>}</p>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <p className="font-medium text-muted-foreground mb-1">Bırakış Analizi:</p>
                    <p>Havalimanı: {testResult.analysis.dropoff.airport || <span className="text-muted-foreground">-</span>}</p>
                    <p>Şehir: {testResult.analysis.dropoff.city || <span className="text-muted-foreground">-</span>}</p>
                    <p>İlçe: {testResult.analysis.dropoff.district || <span className="text-muted-foreground">-</span>}</p>
                  </div>
                </div>
                
                {!testResult.result.found && (
                  <div className="mt-3 p-2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Bu güzergah için fiyat bulunamadı. Lütfen yukarıdan yeni bir fiyat kaydı ekleyin.
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fiyat Listesi
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Fiyat Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrice ? 'Fiyat Düzenle' : 'Yeni Fiyat Ekle'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Şehir *</Label>
                    <Select value={formCity} onValueChange={(val) => {
                      setFormCity(val);
                      setFormAirport('');
                      setFormDistrict('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(CITIES_DATA).map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Havalimanı</Label>
                    <Select value={formAirport} onValueChange={setFormAirport} disabled={!formCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Havalimanı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAirports.map((airport: string) => (
                          <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>İlçe/Bölge *</Label>
                    <Select value={formDistrict} onValueChange={setFormDistrict} disabled={!formCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="İlçe seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDistricts.map((district: string) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Araç Tipi *</Label>
                    <Select value={formVehicleType} onValueChange={setFormVehicleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fiyat *</Label>
                      <MoneyInput
                        value={formPrice}
                        onValueChange={setFormPrice}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi</Label>
                      <Select value={formCurrency} onValueChange={setFormCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Şehir, ilçe veya havalimanı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Şehir filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  {Object.keys(CITIES_DATA).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {prices.length === 0 
                  ? 'Henüz fiyat eklenmemiş. Yeni fiyat eklemek için butona tıklayın.'
                  : 'Arama kriterlerine uygun fiyat bulunamadı.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şehir</TableHead>
                      <TableHead>Havalimanı</TableHead>
                      <TableHead>İlçe/Bölge</TableHead>
                      <TableHead>Araç</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.city}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {price.airport || '-'}
                        </TableCell>
                        <TableCell>{price.district}</TableCell>
                        <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                        <TableCell className="text-right font-bold text-accent">
                          {formatPrice(price.price, price.price_currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(price)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(price.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-sm text-muted-foreground">
              Toplam {filteredPrices.length} fiyat kaydı
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminRegionPrices;
