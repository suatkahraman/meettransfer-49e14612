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
import { ArrowLeft, Plus, Pencil, Trash2, Search, MapPin, TestTube, CheckCircle, XCircle, AlertTriangle, ArrowRightLeft } from 'lucide-react';
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

// Vehicle types - synced with src/lib/vehicleTypes.ts
// Use centralized vehicle types from lib
import { VEHICLE_TYPE_OPTIONS as VEHICLE_TYPES } from '@/lib/vehicleTypes';

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

interface IntercityPrice {
  id: string;
  from_city: string;
  to_city: string;
  vehicle_type: string;
  price: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
}

const AdminRegionPrices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'airport' | 'intercity'>('airport');
  
  // Airport transfer prices state
  const [prices, setPrices] = useState<RegionPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<RegionPrice | null>(null);
  
  // Airport form state
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
  
  // Intercity prices state
  const [intercityPrices, setIntercityPrices] = useState<IntercityPrice[]>([]);
  const [intercityLoading, setIntercityLoading] = useState(true);
  const [intercitySearchTerm, setIntercitySearchTerm] = useState('');
  const [isIntercityDialogOpen, setIsIntercityDialogOpen] = useState(false);
  const [editingIntercityPrice, setEditingIntercityPrice] = useState<IntercityPrice | null>(null);
  
  // Intercity form state
  const [intercityFromCity, setIntercityFromCity] = useState('');
  const [intercityToCity, setIntercityToCity] = useState('');
  const [intercityVehicleType, setIntercityVehicleType] = useState('mercedes-vito');
  const [intercityPrice, setIntercityPrice] = useState('');
  const [intercityCurrency, setIntercityCurrency] = useState('EUR');
  const [intericitySaving, setIntercitySaving] = useState(false);

  useEffect(() => {
    fetchPrices();
    fetchIntercityPrices();
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

  const fetchIntercityPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('intercity_prices')
        .select('*')
        .order('from_city', { ascending: true })
        .order('to_city', { ascending: true });

      if (error) throw error;
      setIntercityPrices(data || []);
    } catch (error) {
      console.error('Error fetching intercity prices:', error);
      toast.error('Şehirler arası fiyatlar yüklenirken hata oluştu');
    } finally {
      setIntercityLoading(false);
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

  // Intercity functions
  const resetIntercityForm = () => {
    setIntercityFromCity('');
    setIntercityToCity('');
    setIntercityVehicleType('mercedes-vito');
    setIntercityPrice('');
    setIntercityCurrency('EUR');
    setEditingIntercityPrice(null);
  };

  const openEditIntercityDialog = (price: IntercityPrice) => {
    setEditingIntercityPrice(price);
    setIntercityFromCity(price.from_city);
    setIntercityToCity(price.to_city);
    setIntercityVehicleType(price.vehicle_type);
    setIntercityPrice(price.price.toString());
    setIntercityCurrency(price.price_currency);
    setIsIntercityDialogOpen(true);
  };

  const openNewIntercityDialog = () => {
    resetIntercityForm();
    setIsIntercityDialogOpen(true);
  };

  const handleIntercitySave = async () => {
    const priceValue = parseFloat(intercityPrice) || 0;
    if (!intercityFromCity || !intercityToCity || priceValue <= 0) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (intercityFromCity === intercityToCity) {
      toast.error('Başlangıç ve varış şehirleri farklı olmalı');
      return;
    }

    setIntercitySaving(true);
    try {
      const priceData = {
        from_city: intercityFromCity,
        to_city: intercityToCity,
        vehicle_type: intercityVehicleType,
        price: priceValue,
        price_currency: intercityCurrency,
        is_active: true,
      };

      if (editingIntercityPrice) {
        const { error } = await supabase
          .from('intercity_prices')
          .update(priceData)
          .eq('id', editingIntercityPrice.id);

        if (error) throw error;
        toast.success('Şehirler arası fiyat güncellendi');
      } else {
        const { error } = await supabase
          .from('intercity_prices')
          .insert([priceData]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Bu kombinasyon için fiyat zaten mevcut');
            return;
          }
          throw error;
        }
        toast.success('Şehirler arası fiyat eklendi');
      }

      setIsIntercityDialogOpen(false);
      resetIntercityForm();
      fetchIntercityPrices();
    } catch (error) {
      console.error('Error saving intercity price:', error);
      toast.error('Fiyat kaydedilirken hata oluştu');
    } finally {
      setIntercitySaving(false);
    }
  };

  const handleIntercityDelete = async (id: string) => {
    if (!confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('intercity_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Şehirler arası fiyat silindi');
      fetchIntercityPrices();
    } catch (error) {
      console.error('Error deleting intercity price:', error);
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

  const filteredIntercityPrices = intercityPrices.filter(price => {
    return price.from_city.toLowerCase().includes(intercitySearchTerm.toLowerCase()) ||
      price.to_city.toLowerCase().includes(intercitySearchTerm.toLowerCase());
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

        {/* Tabs for Airport and Intercity */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'airport' | 'intercity')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="airport" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Havalimanı Transferleri
            </TabsTrigger>
            <TabsTrigger value="intercity" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Şehirler Arası
            </TabsTrigger>
          </TabsList>

          {/* Airport Transfers Tab */}
          <TabsContent value="airport">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Havalimanı Transfer Fiyatları
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
          </TabsContent>

          {/* Intercity Transfers Tab */}
          <TabsContent value="intercity">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Şehirler Arası Fiyatlar
                </CardTitle>
                <Dialog open={isIntercityDialogOpen} onOpenChange={setIsIntercityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewIntercityDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Fiyat Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingIntercityPrice ? 'Şehirler Arası Fiyat Düzenle' : 'Yeni Şehirler Arası Fiyat'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Başlangıç Şehri *</Label>
                        <Select value={intercityFromCity} onValueChange={setIntercityFromCity}>
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
                        <Label>Varış Şehri *</Label>
                        <Select value={intercityToCity} onValueChange={setIntercityToCity}>
                          <SelectTrigger>
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(CITIES_DATA).map(city => (
                              <SelectItem key={city} value={city} disabled={city === intercityFromCity}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Araç Tipi *</Label>
                        <Select value={intercityVehicleType} onValueChange={setIntercityVehicleType}>
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
                            value={intercityPrice}
                            onValueChange={setIntercityPrice}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Para Birimi</Label>
                          <Select value={intercityCurrency} onValueChange={setIntercityCurrency}>
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
                      <Button variant="outline" onClick={() => setIsIntercityDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button onClick={handleIntercitySave} disabled={intericitySaving}>
                        {intericitySaving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Şehir ara..."
                      value={intercitySearchTerm}
                      onChange={(e) => setIntercitySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Table */}
                {intercityLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredIntercityPrices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {intercityPrices.length === 0 
                      ? 'Henüz şehirler arası fiyat eklenmemiş. Yeni fiyat eklemek için butona tıklayın.'
                      : 'Arama kriterlerine uygun fiyat bulunamadı.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Başlangıç</TableHead>
                          <TableHead></TableHead>
                          <TableHead>Varış</TableHead>
                          <TableHead>Araç</TableHead>
                          <TableHead className="text-right">Fiyat</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIntercityPrices.map((price) => (
                          <TableRow key={price.id}>
                            <TableCell className="font-medium">{price.from_city}</TableCell>
                            <TableCell className="text-center">
                              <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-auto" />
                            </TableCell>
                            <TableCell className="font-medium">{price.to_city}</TableCell>
                            <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                            <TableCell className="text-right font-bold text-accent">
                              {formatPrice(price.price, price.price_currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditIntercityDialog(price)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleIntercityDelete(price.id)}
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
                  Toplam {filteredIntercityPrices.length} şehirler arası fiyat kaydı
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminRegionPrices;
