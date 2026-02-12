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
import { ArrowLeft, Plus, Pencil, Trash2, Search, MapPin, TestTube, CheckCircle, XCircle, AlertTriangle, ArrowRightLeft, Percent, Calendar, CalendarDays } from 'lucide-react';

function priceCoversMonth(price: { valid_from?: string | null; valid_to?: string | null }, month: number, year: number): boolean {
  if (!price.valid_from || !price.valid_to) return true;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  try {
    const from = new Date(price.valid_from);
    const to = new Date(price.valid_to);
    return from <= lastDay && to >= firstDay;
  } catch {
    return false;
  }
}
import BulkPriceUpdateDialog from "@/components/admin/BulkPriceUpdateDialog";
import MonthlyPriceUpdateDialog from "@/components/admin/MonthlyPriceUpdateDialog";
import SeasonalPricesManager from "@/components/admin/SeasonalPricesManager";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';
import { testPriceMatch, MatchResult } from '@/lib/priceMatching';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Türkiye şehirleri ve havalimanları
type CityData = {
  airports: string[];
  districts: string[];
};

const CITIES_DATA: Record<string, CityData> = {
  'Istanbul': {
    airports: ['Istanbul Airport (IST)', 'Sabiha Gokcen Airport (SAW)'],
    districts: ['Taksim', 'Sultanahmet', 'Kadikoy', 'Besiktas', 'Sisli', 'Fatih', 'Beyoglu', 'Uskudar', 'Bakirkoy', 'Atasehir', 'Maltepe', 'Pendik', 'Kartal', 'Sariyer', 'Zeytinburnu', 'Mecidiyekoy', 'Levent', 'Maslak', 'Yenikoy', 'Bebek', 'Ortakoy', 'Nisantasi', 'Cihangir', 'Galata', 'Karakoy', 'Eminonu', 'Balat', 'Eyup', 'Sile', 'Buyukcekmece', 'Beylikduzu', 'Avcilar', 'Arnavutkoy', 'Catalca', 'Silivri', 'Bagcilar', 'Bahcelievler', 'Gungoren', 'Esenler', 'Gaziosmanpasa', 'Sultangazi', 'Kucukcekmece', 'Esenyurt', 'Basaksehir', 'Kartal', 'Tuzla', 'Cekmekoy', 'Sancaktepe', 'Sultanbeyli', 'Beykoz']
  },
  'Antalya': {
    airports: ['Antalya Airport (AYT)'],
    districts: ['Kaleici', 'Konyaalti', 'Lara', 'Belek', 'Side', 'Kemer', 'Kas', 'Kalkan', 'Fethiye', 'Manavgat', 'Serik', 'Kundu', 'Beldibi', 'Goynuk', 'Tekirova', 'Cirali', 'Olympos', 'Kadriye', 'Bogazkent', 'Kumkoy', 'Colakli', 'Evrenseki', 'Titreyengol', 'Demre', 'Finike', 'Kumluca', 'Elmali', 'Akseki', 'Korkuteli']
  },
  'Alanya': {
    airports: ['Antalya Airport (AYT)', 'Gazipasa-Alanya Airport (GZP)'],
    districts: ['Alanya', 'Mahmutlar', 'Kestel', 'Tosmur', 'Oba', 'Cikcilli', 'Konakli', 'Payallar', 'Turkler', 'Avsallar', 'Incekum', 'Okurcalar', 'Kargicak', 'Demirtas', 'Gazipasa']
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
  },
  'Aydin': {
    airports: [],
    districts: ['Aydin Center', 'Kusadasi', 'Didim', 'Altinkum', 'Akbuk', 'Soke', 'Nazilli', 'Germencik', 'Incirliova', 'Kocarli', 'Sultanhisar', 'Aydinlar', 'Davutlar', 'Guzelcamli', 'Karacasu', 'Kuyucak', 'Buharkent', 'Yenipazar', 'Bozdogan', 'Cine', 'Kosk', 'Umurlu']
  },
  'Mugla': {
    airports: ['Dalaman Airport (DLM)', 'Bodrum-Milas Airport (BJV)'],
    districts: ['Mugla Center', 'Marmaris', 'Datca', 'Fethiye', 'Koycegiz', 'Ortaca', 'Dalyan', 'Oludeniz', 'Hisaronu', 'Gocek', 'Icmeler', 'Turunc', 'Akyaka', 'Bozburun', 'Selimiye', 'Sogut', 'Taslica', 'Armutalan', 'Beldibi', 'Sarigerme', 'Calis', 'Ovacik', 'Kayakoy', 'Seydikemer', 'Ula', 'Yatagan', 'Milas', 'Bodrum']
  },
  'Denizli': {
    airports: ['Denizli Cardak Airport (DNZ)'],
    districts: ['Denizli Center', 'Pamukkale', 'Hierapolis', 'Laodikeia', 'Karahayit', 'Merkezefendi', 'Saraykoy', 'Acipayam', 'Buldan', 'Civril', 'Tavas', 'Honaz', 'Kaklik', 'Colossae', 'Tripolis', 'Babadag', 'Bekilli', 'Bozkurt', 'Cal', 'Cardak', 'Guney', 'Kale', 'Serinhisar']
  },
  'Adana': {
    airports: ['Adana Sakirpasa Airport (ADA)'],
    districts: ['Adana Center', 'Seyhan', 'Cukurova', 'Yuregir', 'Saricam', 'Karaisali', 'Pozanti', 'Tarsus', 'Ceyhan', 'Kozan', 'Imamoglu', 'Kadirli', 'Aladag', 'Feke', 'Saimbeyli', 'Tufanbeyli', 'Yumurtalik', 'Karatas']
  },
  'Ankara': {
    airports: ['Ankara Esenboga Airport (ESB)'],
    districts: ['Ankara Center', 'Cankaya', 'Kizilay', 'Ulus', 'Kavaklidere', 'Tunali', 'Bahcelievler', 'Emek', 'Ayranci', 'GOP', 'Dikmen', 'Oran', 'Cayyolu', 'Yasamkent', 'Batikent', 'Kecioren', 'Etimesgut', 'Sincan', 'Yenimahalle', 'Mamak', 'Altindag', 'Pursaklar', 'Golbasi', 'Beypazari', 'Polatli', 'Haymana', 'Cubuk', 'Kazan', 'Akyurt', 'Elmadag']
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
  valid_from?: string | null;
  valid_to?: string | null;
}

const MONTHS = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];

interface IntercityPrice {
  id: string;
  from_city: string;
  from_district: string | null;
  to_city: string;
  to_district: string | null;
  vehicle_type: string;
  price: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
  valid_from?: string | null;
  valid_to?: string | null;
}

const AdminRegionPrices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'airport' | 'intercity' | 'seasonal'>('airport');
  
  // Airport transfer prices state
  const [prices, setPrices] = useState<RegionPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear] = useState<number>(() => new Date().getFullYear());
  const [filterPriceType, setFilterPriceType] = useState<'all' | 'base' | 'seasonal'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [isBulkIntercityUpdateDialogOpen, setIsBulkIntercityUpdateDialogOpen] = useState(false);
  const [isMonthlyUpdateDialogOpen, setIsMonthlyUpdateDialogOpen] = useState(false);
  const [isMonthlyIntercityUpdateDialogOpen, setIsMonthlyIntercityUpdateDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<RegionPrice | null>(null);
  
  // Airport form state - now supports all 4 vehicles at once
  const [formCity, setFormCity] = useState('');
  const [formAirport, setFormAirport] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formCurrency, setFormCurrency] = useState('EUR');
  // Individual prices for each vehicle type
  const [formPrices, setFormPrices] = useState<Record<string, string>>({
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });
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
  const [intercityFilterMonth, setIntercityFilterMonth] = useState<string>('all');
  const [intercityFilterYear] = useState<number>(() => new Date().getFullYear());
  const [intercityFilterPriceType, setIntercityFilterPriceType] = useState<'all' | 'base' | 'seasonal'>('all');
  const [isIntercityDialogOpen, setIsIntercityDialogOpen] = useState(false);
  const [editingIntercityPrice, setEditingIntercityPrice] = useState<IntercityPrice | null>(null);
  
  // Intercity form state - now supports all 4 vehicles at once
  const [intercityFromCity, setIntercityFromCity] = useState('');
  const [intercityFromDistrict, setIntercityFromDistrict] = useState('');
  const [intercityToCity, setIntercityToCity] = useState('');
  const [intercityToDistrict, setIntercityToDistrict] = useState('');
  const [intercityCurrency, setIntercityCurrency] = useState('EUR');
  // Individual prices for each vehicle type
  const [intercityPricesForm, setIntercityPricesForm] = useState<Record<string, string>>({
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });
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
    setFormPrices({
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    });
    setFormCurrency('EUR');
    setEditingPrice(null);
  };

  const openEditDialog = (price: RegionPrice) => {
    // When editing, we need to load all prices for this city/airport/district
    setEditingPrice(price);
    setFormCity(price.city);
    setFormAirport(price.airport || '');
    setFormDistrict(price.district);
    setFormCurrency(price.price_currency);
    
    // Load all vehicle prices for this route
    const routePrices: Record<string, string> = {
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    };
    
    prices
      .filter(p => p.city === price.city && p.airport === price.airport && p.district === price.district)
      .forEach(p => {
        routePrices[p.vehicle_type] = p.price.toString();
      });
    
    setFormPrices(routePrices);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Check that at least one price is entered
    const hasAnyPrice = Object.values(formPrices).some(p => parseFloat(p) > 0);
    if (!formCity || !formDistrict || !hasAnyPrice) {
      toast.error('Lütfen tüm zorunlu alanları doldurun ve en az bir araç fiyatı girin');
      return;
    }

    setSaving(true);
    try {
      // Process each vehicle type
      for (const vehicleType of VEHICLE_TYPES) {
        const priceValue = parseFloat(formPrices[vehicleType.value]) || 0;
        
        // Check if a price already exists for this combination
        const existingPrice = prices.find(
          p => p.city === formCity && 
               p.airport === (formAirport || null) && 
               p.district === formDistrict && 
               p.vehicle_type === vehicleType.value
        );
        
        if (priceValue > 0) {
          const priceData = {
            city: formCity,
            airport: formAirport || null,
            district: formDistrict,
            vehicle_type: vehicleType.value,
            price: priceValue,
            price_currency: formCurrency,
            is_active: true,
          };

          if (existingPrice) {
            // Update existing price
            const { error } = await supabase
              .from('region_prices')
              .update(priceData)
              .eq('id', existingPrice.id);
            if (error) throw error;
          } else {
            // Insert new price
            const { error } = await supabase
              .from('region_prices')
              .insert([priceData]);
            if (error && error.code !== '23505') throw error;
          }
        } else if (existingPrice) {
          // Delete price if set to 0 or empty
          const { error } = await supabase
            .from('region_prices')
            .delete()
            .eq('id', existingPrice.id);
          if (error) throw error;
        }
      }

      toast.success('Fiyatlar kaydedildi');
      setIsDialogOpen(false);
      resetForm();
      fetchPrices();
    } catch (error) {
      console.error('Error saving prices:', error);
      toast.error('Fiyatlar kaydedilirken hata oluştu');
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
    setIntercityFromDistrict('');
    setIntercityToCity('');
    setIntercityToDistrict('');
    setIntercityPricesForm({
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    });
    setIntercityCurrency('EUR');
    setEditingIntercityPrice(null);
  };

  const openEditIntercityDialog = (price: IntercityPrice) => {
    setEditingIntercityPrice(price);
    setIntercityFromCity(price.from_city);
    setIntercityFromDistrict(price.from_district || '');
    setIntercityToCity(price.to_city);
    setIntercityToDistrict(price.to_district || '');
    setIntercityCurrency(price.price_currency);
    
    // Load all vehicle prices for this route
    const routePrices: Record<string, string> = {
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    };
    
    intercityPrices
      .filter(p => p.from_city === price.from_city && 
                   p.from_district === price.from_district && 
                   p.to_city === price.to_city && 
                   p.to_district === price.to_district)
      .forEach(p => {
        routePrices[p.vehicle_type] = p.price.toString();
      });
    
    setIntercityPricesForm(routePrices);
    setIsIntercityDialogOpen(true);
  };

  const openNewIntercityDialog = () => {
    resetIntercityForm();
    setIsIntercityDialogOpen(true);
  };

  const handleIntercitySave = async () => {
    // Check that at least one price is entered
    const hasAnyPrice = Object.values(intercityPricesForm).some(p => parseFloat(p) > 0);
    if (!intercityFromCity || !intercityToCity || !hasAnyPrice) {
      toast.error('Lütfen tüm zorunlu alanları doldurun ve en az bir araç fiyatı girin');
      return;
    }

    if (intercityFromCity === intercityToCity && intercityFromDistrict === intercityToDistrict) {
      toast.error('Başlangıç ve varış konumları farklı olmalı');
      return;
    }

    setIntercitySaving(true);
    try {
      // Process each vehicle type
      for (const vehicleType of VEHICLE_TYPES) {
        const priceValue = parseFloat(intercityPricesForm[vehicleType.value]) || 0;
        
        // Check if a price already exists for this combination
        const existingPrice = intercityPrices.find(
          p => p.from_city === intercityFromCity && 
               p.from_district === (intercityFromDistrict || null) && 
               p.to_city === intercityToCity && 
               p.to_district === (intercityToDistrict || null) && 
               p.vehicle_type === vehicleType.value
        );
        
        if (priceValue > 0) {
          const priceData = {
            from_city: intercityFromCity,
            from_district: intercityFromDistrict || null,
            to_city: intercityToCity,
            to_district: intercityToDistrict || null,
            vehicle_type: vehicleType.value,
            price: priceValue,
            price_currency: intercityCurrency,
            is_active: true,
          };

          if (existingPrice) {
            // Update existing price
            const { error } = await supabase
              .from('intercity_prices')
              .update(priceData)
              .eq('id', existingPrice.id);
            if (error) throw error;
          } else {
            // Insert new price
            const { error } = await supabase
              .from('intercity_prices')
              .insert([priceData]);
            if (error && error.code !== '23505') throw error;
          }
        } else if (existingPrice) {
          // Delete price if set to 0 or empty
          const { error } = await supabase
            .from('intercity_prices')
            .delete()
            .eq('id', existingPrice.id);
          if (error) throw error;
        }
      }

      toast.success('Şehirler arası fiyatlar kaydedildi');
      setIsIntercityDialogOpen(false);
      resetIntercityForm();
      fetchIntercityPrices();
    } catch (error) {
      console.error('Error saving intercity prices:', error);
      toast.error('Fiyatlar kaydedilirken hata oluştu');
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

  const getMonthFromDate = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    try {
      const date = new Date(dateStr);
      return date.getMonth() + 1;
    } catch {
      return 0;
    }
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = 
      price.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (price.airport && price.airport.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = filterCity === 'all' || price.city === filterCity;
    
    const isSeasonalPrice = price.valid_from && price.valid_to;
    // Seçilen ay varsa temel fiyatları her zaman göster; böylece fiyat olmayan aylarda da temel listelenir
    const matchesPriceType = filterPriceType === 'all' || 
      (filterPriceType === 'base' && !isSeasonalPrice) ||
      (filterPriceType === 'seasonal' && isSeasonalPrice) ||
      (filterMonth !== 'all' && !isSeasonalPrice);
    
    // Ay: seçilen ayı kapsayan sezonluk fiyatlar (valid_from..valid_to aralığı) veya temel fiyatlar (hepsi)
    const monthNum = filterMonth === 'all' ? 0 : parseInt(filterMonth, 10);
    const matchesMonth = filterMonth === 'all' || priceCoversMonth(price, monthNum, filterYear);
    
    return matchesSearch && matchesCity && matchesPriceType && matchesMonth;
  });

  const filteredIntercityPrices = intercityPrices.filter(price => {
    const matchesSearch = !intercitySearchTerm ||
      price.from_city.toLowerCase().includes(intercitySearchTerm.toLowerCase()) ||
      price.to_city.toLowerCase().includes(intercitySearchTerm.toLowerCase()) ||
      (price.from_district && price.from_district.toLowerCase().includes(intercitySearchTerm.toLowerCase())) ||
      (price.to_district && price.to_district.toLowerCase().includes(intercitySearchTerm.toLowerCase()));
    const isBase = !price.valid_from && !price.valid_to;
    const matchesPriceType = intercityFilterPriceType === 'all' ||
      (intercityFilterPriceType === 'base' && isBase) ||
      (intercityFilterPriceType === 'seasonal' && !!price.valid_from);
    const monthNum = intercityFilterMonth === 'all' ? 0 : parseInt(intercityFilterMonth, 10);
    const matchesMonth = intercityFilterMonth === 'all' || priceCoversMonth(price, monthNum, intercityFilterYear);
    return matchesSearch && matchesPriceType && matchesMonth;
  });

  const availableAirports = formCity ? CITIES_DATA[formCity]?.airports || [] : [];
  const availableDistricts = formCity ? CITIES_DATA[formCity]?.districts || [] : [];
  
  // Intercity districts (including airports)
  const intercityFromDistricts = intercityFromCity ? [
    ...(CITIES_DATA[intercityFromCity]?.airports || []),
    ...(CITIES_DATA[intercityFromCity]?.districts || [])
  ] : [];
  const intercityToDistricts = intercityToCity ? [
    ...(CITIES_DATA[intercityToCity]?.airports || []),
    ...(CITIES_DATA[intercityToCity]?.districts || [])
  ] : [];
  
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

        {/* Tabs for Airport, Intercity, and Seasonal */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'airport' | 'intercity' | 'seasonal')}>
          <TabsList className="grid w-full grid-cols-3 min-w-0 sm:grid-cols-3 h-auto flex-wrap sm:flex-nowrap gap-1 p-1">
            <TabsTrigger value="airport" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">Havalimanı</span>
            </TabsTrigger>
            <TabsTrigger value="intercity" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <ArrowRightLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Şehirler Arası</span>
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="truncate">Sezonluk</span>
            </TabsTrigger>
          </TabsList>

          {/* Airport Transfers Tab */}
          <TabsContent value="airport">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-5 w-5 shrink-0" />
                  Havalimanı Transfer Fiyatları
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsMonthlyUpdateDialogOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2 shrink-0" />
                    Aylık Fiyat
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsBulkUpdateDialogOpen(true)}>
                    <Percent className="h-4 w-4 mr-2 shrink-0" />
                    % Güncelle
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1 sm:flex-none" onClick={openNewDialog}>
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
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

                      {/* All Vehicle Prices */}
                      <div className="space-y-3">
                        <Label>Araç Fiyatları *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {VEHICLE_TYPES.map(v => (
                            <div key={v.value} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{v.label}</Label>
                              <MoneyInput
                                value={formPrices[v.value]}
                                onValueChange={(val) => setFormPrices(prev => ({ ...prev, [v.value]: val }))}
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
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
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
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
                    <Select value={filterPriceType} onValueChange={(v) => setFilterPriceType(v as 'all' | 'base' | 'seasonal')}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Fiyat tipi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Fiyatlar</SelectItem>
                        <SelectItem value="base">Temel Fiyat</SelectItem>
                        <SelectItem value="seasonal">Aylık Fiyat</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ay filtrele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Aylar</SelectItem>
                        {MONTHS.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Active filter summary */}
                  {(filterCity !== 'all' || filterMonth !== 'all' || filterPriceType !== 'all') && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
                      {filterCity !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          Şehir: {filterCity}
                          <button onClick={() => setFilterCity('all')} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {filterPriceType !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filterPriceType === 'base' ? 'Temel' : 'Aylık'} Fiyat
                          <button onClick={() => setFilterPriceType('all')} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {filterMonth !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {MONTHS.find(m => m.value.toString() === filterMonth)?.label}
                          <button onClick={() => setFilterMonth('all')} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => {
                        setFilterCity('all');
                        setFilterMonth('all');
                        setFilterPriceType('all');
                        setSearchTerm('');
                      }}>
                        Temizle
                      </Button>
                    </div>
                  )}
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
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Şehir</TableHead>
                            <TableHead>Havalimanı</TableHead>
                            <TableHead>İlçe/Bölge</TableHead>
                            <TableHead>Araç</TableHead>
                            <TableHead>Dönem</TableHead>
                            <TableHead className="text-right">Fiyat</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPrices.map((price) => {
                            const isSeasonalPrice = price.valid_from && price.valid_to;
                            const monthLabel = isSeasonalPrice && price.valid_from
                              ? MONTHS.find(m => m.value === getMonthFromDate(price.valid_from))?.label
                              : null;
                            return (
                              <TableRow key={price.id}>
                                <TableCell className="font-medium">{price.city}</TableCell>
                                <TableCell className="text-muted-foreground">{price.airport || '-'}</TableCell>
                                <TableCell>{price.district}</TableCell>
                                <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                                <TableCell>
                                  {isSeasonalPrice ? (
                                    <Badge variant="secondary" className="text-xs">{monthLabel} {new Date(price.valid_from!).getFullYear()}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Temel Fiyat</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-bold text-accent">{formatPrice(price.price, price.price_currency)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(price)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(price.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden space-y-3">
                      {filteredPrices.map((price) => {
                        const isSeasonalPrice = price.valid_from && price.valid_to;
                        const monthLabel = isSeasonalPrice && price.valid_from
                          ? MONTHS.find(m => m.value === getMonthFromDate(price.valid_from))?.label
                          : null;
                        return (
                          <Card key={price.id} className="p-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{price.city}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{price.airport || '-'} · {price.district}</div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">{getVehicleLabel(price.vehicle_type)}</span>
                                  {isSeasonalPrice ? (
                                    <Badge variant="secondary" className="text-xs">{monthLabel} {new Date(price.valid_from!).getFullYear()}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Temel</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="font-bold text-accent">{formatPrice(price.price, price.price_currency)}</span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(price)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(price.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
                  <span>
                    Toplam {filteredPrices.length} fiyat kaydı
                    {filterCity !== 'all' && ` (${filterCity})`}
                    {filterMonth !== 'all' && ` - ${MONTHS.find(m => m.value.toString() === filterMonth)?.label}`}
                  </span>
                  <span className="text-xs">
                    Temel: {prices.filter(p => !p.valid_from).length} | 
                    Aylık: {prices.filter(p => p.valid_from).length}
                  </span>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsMonthlyIntercityUpdateDialogOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Aylık Fiyat
                  </Button>
                  <Button variant="outline" onClick={() => setIsBulkIntercityUpdateDialogOpen(true)}>
                    <Percent className="h-4 w-4 mr-2" />
                    % Güncelle
                  </Button>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Başlangıç Şehri *</Label>
                          <Select value={intercityFromCity} onValueChange={(val) => {
                            setIntercityFromCity(val);
                            setIntercityFromDistrict('');
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
                          <Label>Başlangıç Bölge</Label>
                          <Select value={intercityFromDistrict || "__none__"} onValueChange={(val) => setIntercityFromDistrict(val === "__none__" ? "" : val)} disabled={!intercityFromCity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Bölge seçin (opsiyonel)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Tümü (Şehir Geneli)</SelectItem>
                              {intercityFromDistricts.map((district: string) => (
                                <SelectItem key={district} value={district}>{district}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Varış Şehri *</Label>
                          <Select value={intercityToCity} onValueChange={(val) => {
                            setIntercityToCity(val);
                            setIntercityToDistrict('');
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
                          <Label>Varış Bölge</Label>
                          <Select value={intercityToDistrict || "__none__"} onValueChange={(val) => setIntercityToDistrict(val === "__none__" ? "" : val)} disabled={!intercityToCity}>
                            <SelectTrigger>
                              <SelectValue placeholder="Bölge seçin (opsiyonel)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Tümü (Şehir Geneli)</SelectItem>
                              {intercityToDistricts.map((district: string) => (
                                <SelectItem key={district} value={district}>{district}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* All Vehicle Prices */}
                      <div className="space-y-3">
                        <Label>Araç Fiyatları *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {VEHICLE_TYPES.map(v => (
                            <div key={v.value} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{v.label}</Label>
                              <MoneyInput
                                value={intercityPricesForm[v.value]}
                                onValueChange={(val) => setIntercityPricesForm(prev => ({ ...prev, [v.value]: val }))}
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
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
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters: search + month + year + price type */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Şehir ara..."
                        value={intercitySearchTerm}
                        onChange={(e) => setIntercitySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={intercityFilterPriceType} onValueChange={(v) => setIntercityFilterPriceType(v as 'all' | 'base' | 'seasonal')}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Fiyat tipi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Fiyatlar</SelectItem>
                        <SelectItem value="base">Temel Fiyat</SelectItem>
                        <SelectItem value="seasonal">Aylık Fiyat</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intercityFilterMonth} onValueChange={setIntercityFilterMonth}>
                      <SelectTrigger className="w-full sm:w-[130px]">
                        <SelectValue placeholder="Ay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Aylar</SelectItem>
                        {MONTHS.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(intercityFilterMonth !== 'all' || intercityFilterPriceType !== 'all') && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
                      {intercityFilterPriceType !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {intercityFilterPriceType === 'base' ? 'Temel' : 'Aylık'} Fiyat
                          <button type="button" onClick={() => setIntercityFilterPriceType('all')} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {intercityFilterMonth !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {MONTHS.find(m => m.value.toString() === intercityFilterMonth)?.label} {intercityFilterYear}
                          <button type="button" onClick={() => setIntercityFilterMonth('all')} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setIntercityFilterMonth('all'); setIntercityFilterPriceType('all'); setIntercitySearchTerm(''); }}>
                        Temizle
                      </Button>
                    </div>
                  )}
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
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Başlangıç</TableHead>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Varış</TableHead>
                            <TableHead>Araç</TableHead>
                            <TableHead>Dönem</TableHead>
                            <TableHead className="text-right">Fiyat</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIntercityPrices.map((price) => {
                            const isSeasonal = !!(price.valid_from && price.valid_to);
                            const monthLabel = isSeasonal && price.valid_from
                              ? MONTHS.find(m => m.value === getMonthFromDate(price.valid_from!))?.label
                              : null;
                            return (
                              <TableRow key={price.id}>
                                <TableCell className="font-medium">
                                  <div>{price.from_city}</div>
                                  {price.from_district && <div className="text-xs text-muted-foreground">{price.from_district}</div>}
                                </TableCell>
                                <TableCell className="text-center">
                                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-auto" />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div>{price.to_city}</div>
                                  {price.to_district && <div className="text-xs text-muted-foreground">{price.to_district}</div>}
                                </TableCell>
                                <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                                <TableCell>
                                  {isSeasonal ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {monthLabel} {price.valid_from ? new Date(price.valid_from).getFullYear() : ''}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Temel</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-bold text-accent">
                                  {formatPrice(price.price, price.price_currency)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditIntercityDialog(price)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleIntercityDelete(price.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {filteredIntercityPrices.map((price) => {
                        const isSeasonal = !!(price.valid_from && price.valid_to);
                        const monthLabel = isSeasonal && price.valid_from
                          ? MONTHS.find(m => m.value === getMonthFromDate(price.valid_from!))?.label
                          : null;
                        return (
                          <Card key={price.id} className="p-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{price.from_city}{price.from_district ? ` · ${price.from_district}` : ''}</div>
                                <div className="flex items-center gap-1 my-1 text-muted-foreground">
                                  <ArrowRightLeft className="h-3 w-3" />
                                  <span className="text-xs">şehirler arası</span>
                                </div>
                                <div className="font-medium text-sm">{price.to_city}{price.to_district ? ` · ${price.to_district}` : ''}</div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">{getVehicleLabel(price.vehicle_type)}</span>
                                  {isSeasonal ? (
                                    <Badge variant="secondary" className="text-xs">{monthLabel} {price.valid_from ? new Date(price.valid_from).getFullYear() : ''}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Temel</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="font-bold text-accent">{formatPrice(price.price, price.price_currency)}</span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditIntercityDialog(price)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleIntercityDelete(price.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className="mt-4 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Toplam {filteredIntercityPrices.length} şehirler arası fiyat kaydı</span>
                  {(intercityFilterMonth !== 'all' || intercityFilterPriceType !== 'all') && (
                    <span className="text-xs">
                      {intercityFilterPriceType !== 'all' && (intercityFilterPriceType === 'base' ? 'Temel' : 'Aylık')}
                      {intercityFilterMonth !== 'all' && ` · ${MONTHS.find(m => m.value.toString() === intercityFilterMonth)?.label} ${intercityFilterYear}`}
                    </span>
                  )}
                  <span className="text-xs">
                    Temel: {intercityPrices.filter(p => !p.valid_from).length} | Aylık: {intercityPrices.filter(p => p.valid_from).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seasonal Prices Tab */}
          <TabsContent value="seasonal" className="space-y-6">
            <SeasonalPricesManager priceType="region" />
            <SeasonalPricesManager priceType="intercity" />
          </TabsContent>
        </Tabs>

        {/* Bulk Price Update Dialogs */}
        <BulkPriceUpdateDialog
          open={isBulkUpdateDialogOpen}
          onOpenChange={setIsBulkUpdateDialogOpen}
          priceType="region"
          onSuccess={fetchPrices}
          cities={Object.keys(CITIES_DATA)}
          vehicleTypes={VEHICLE_TYPES}
        />
        <BulkPriceUpdateDialog
          open={isBulkIntercityUpdateDialogOpen}
          onOpenChange={setIsBulkIntercityUpdateDialogOpen}
          priceType="intercity"
          onSuccess={fetchIntercityPrices}
          cities={Object.keys(CITIES_DATA)}
          vehicleTypes={VEHICLE_TYPES}
        />
        
        {/* Monthly Price Update Dialogs */}
        <MonthlyPriceUpdateDialog
          open={isMonthlyUpdateDialogOpen}
          onOpenChange={setIsMonthlyUpdateDialogOpen}
          priceType="region"
          onSuccess={fetchPrices}
          cities={Object.keys(CITIES_DATA)}
          vehicleTypes={VEHICLE_TYPES}
        />
        <MonthlyPriceUpdateDialog
          open={isMonthlyIntercityUpdateDialogOpen}
          onOpenChange={setIsMonthlyIntercityUpdateDialogOpen}
          priceType="intercity"
          onSuccess={fetchIntercityPrices}
          cities={Object.keys(CITIES_DATA)}
          vehicleTypes={VEHICLE_TYPES}
        />
      </main>
    </div>
  );
};

export default AdminRegionPrices;
