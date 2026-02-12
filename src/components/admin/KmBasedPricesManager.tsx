import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ruler, Search, Shield } from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { VEHICLE_TYPE_OPTIONS as VEHICLE_TYPES } from "@/lib/vehicleTypes";

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

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'TRY', label: '₺ TRY' },
  { value: 'GBP', label: '£ GBP' },
];

// Default KM ranges
const DEFAULT_KM_RANGES = [
  { from: 1, to: 50, label: "1 - 50 km (Sabit Baz Fiyat)" },
  { from: 51, to: 100, label: "51 - 100 km" },
  { from: 101, to: 150, label: "101 - 150 km" },
  { from: 151, to: 200, label: "151 - 200 km" },
  { from: 201, to: 300, label: "201 - 300 km" },
  { from: 301, to: 500, label: "301 - 500 km" },
];

interface KmBasedPrice {
  id: string;
  city: string;
  month: number;
  km_from: number;
  km_to: number;
  vehicle_type: string;
  price: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KmBasedPricesManagerProps {
  cities: string[];
}

const KmBasedPricesManager = ({ cities }: KmBasedPricesManagerProps) => {
  const [prices, setPrices] = useState<KmBasedPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<KmBasedPrice | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formCity, setFormCity] = useState("");
  const [formMonth, setFormMonth] = useState<string>("");
  const [formKmFrom, setFormKmFrom] = useState("");
  const [formKmTo, setFormKmTo] = useState("");
  const [formCurrency, setFormCurrency] = useState("EUR");
  // Multi-vehicle prices
  const [formPrices, setFormPrices] = useState<Record<string, string>>({
    'sedan': '',
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });

  // Base price dialog state
  const [isBasePriceDialogOpen, setIsBasePriceDialogOpen] = useState(false);
  const [basePriceCity, setBasePriceCity] = useState("");
  const [basePriceMonth, setBasePriceMonth] = useState<string>("");
  const [basePriceCurrency, setBasePriceCurrency] = useState("EUR");
  const [basePriceValues, setBasePriceValues] = useState<Record<string, string>>({
    'sedan': '',
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });
  const [basePriceSaving, setBasePriceSaving] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("km_based_prices")
        .select("*")
        .order("city", { ascending: true })
        .order("month", { ascending: true })
        .order("km_from", { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error("Error fetching km-based prices:", error);
      toast.error("KM bazlı fiyatlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCity("");
    setFormMonth("");
    setFormKmFrom("");
    setFormKmTo("");
    setFormCurrency("EUR");
    setFormPrices({
      'sedan': '',
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    });
    setEditingPrice(null);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (price: KmBasedPrice) => {
    setEditingPrice(price);
    setFormCity(price.city);
    setFormMonth(price.month.toString());
    setFormKmFrom(price.km_from.toString());
    setFormKmTo(price.km_to.toString());
    setFormCurrency(price.price_currency);

    // Load all vehicle prices for this route/range
    const routePrices: Record<string, string> = {
      'sedan': '',
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    };

    prices
      .filter(
        (p) =>
          p.city === price.city &&
          p.month === price.month &&
          p.km_from === price.km_from &&
          p.km_to === price.km_to
      )
      .forEach((p) => {
        routePrices[p.vehicle_type] = p.price.toString();
      });

    setFormPrices(routePrices);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const hasAnyPrice = Object.values(formPrices).some(
      (p) => p && parseFloat(p) > 0
    );
    if (!formCity || !formMonth || !formKmFrom || !formKmTo || !hasAnyPrice) {
      toast.error(
        "Lütfen tüm zorunlu alanları doldurun ve en az bir araç fiyatı girin"
      );
      return;
    }

    const kmFrom = parseInt(formKmFrom);
    const kmTo = parseInt(formKmTo);
    
    if (isNaN(kmFrom) || isNaN(kmTo)) {
      toast.error("Geçerli KM değerleri girin");
      return;
    }
    if (kmTo <= kmFrom) {
      toast.error("KM bitiş değeri başlangıçtan büyük olmalı");
      return;
    }

    const monthNum = parseInt(formMonth);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      toast.error("Geçerli bir ay seçin");
      return;
    }

    setSaving(true);
    try {
      let savedCount = 0;
      for (const vehicleType of VEHICLE_TYPES) {
        const priceValue = parseFloat(formPrices[vehicleType.value] || "0") || 0;

        // Check if a price already exists for this combination
        const existingPrice = prices.find(
          (p) =>
            p.city === formCity &&
            p.month === monthNum &&
            p.km_from === kmFrom &&
            p.km_to === kmTo &&
            p.vehicle_type === vehicleType.value
        );

        if (priceValue > 0) {
          const priceData = {
            city: formCity,
            month: monthNum,
            km_from: kmFrom,
            km_to: kmTo,
            vehicle_type: vehicleType.value,
            price: priceValue,
            price_currency: formCurrency,
            is_active: true,
          };

          if (existingPrice) {
            const { error } = await supabase
              .from("km_based_prices")
              .update({ ...priceData, updated_at: new Date().toISOString() })
              .eq("id", existingPrice.id);
            if (error) {
              console.error("Update error:", error);
              throw new Error(`Güncelleme hatası: ${error.message}`);
            }
            savedCount++;
          } else {
            const { error } = await supabase
              .from("km_based_prices")
              .insert([priceData]);
            if (error) {
              // Duplicate key is OK (upsert behavior)
              if (error.code === "23505") {
                // Try update instead
                const { error: updateErr } = await supabase
                  .from("km_based_prices")
                  .update({ price: priceValue, price_currency: formCurrency, is_active: true, updated_at: new Date().toISOString() })
                  .eq("city", formCity)
                  .eq("month", monthNum)
                  .eq("km_from", kmFrom)
                  .eq("km_to", kmTo)
                  .eq("vehicle_type", vehicleType.value);
                if (updateErr) {
                  console.error("Upsert fallback error:", updateErr);
                  throw new Error(`Kayıt hatası: ${updateErr.message}`);
                }
              } else {
                console.error("Insert error:", error);
                throw new Error(`Ekleme hatası: ${error.message}`);
              }
            }
            savedCount++;
          }
        } else if (existingPrice) {
          const { error } = await supabase
            .from("km_based_prices")
            .delete()
            .eq("id", existingPrice.id);
          if (error) {
            console.error("Delete error:", error);
          }
        }
      }

      toast.success(`${savedCount} araç fiyatı kaydedildi (${formCity}, ${kmFrom}-${kmTo} km)`);
      setIsDialogOpen(false);
      resetForm();
      fetchPrices();
    } catch (error: any) {
      console.error("Error saving km-based prices:", error);
      toast.error(error?.message || "Fiyatlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (price: KmBasedPrice) => {
    if (!confirm("Bu fiyatı silmek istediğinizden emin misiniz?")) return;

    try {
      // Delete all vehicle types for this km range
      const { error } = await supabase
        .from("km_based_prices")
        .delete()
        .eq("city", price.city)
        .eq("month", price.month)
        .eq("km_from", price.km_from)
        .eq("km_to", price.km_to);

      if (error) throw error;
      toast.success("KM bazlı fiyat silindi");
      fetchPrices();
    } catch (error) {
      console.error("Error deleting km-based price:", error);
      toast.error("Fiyat silinirken hata oluştu");
    }
  };

  // Base price (1-50 km) management
  const openBasePriceDialog = () => {
    setBasePriceCity("");
    setBasePriceMonth("");
    setBasePriceCurrency("EUR");
    setBasePriceValues({
      'sedan': '',
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    });
    setIsBasePriceDialogOpen(true);
  };

  const loadBasePrices = (city: string, month: string) => {
    if (!city || !month) return;
    const monthNum = parseInt(month);
    const routePrices: Record<string, string> = {
      'sedan': '',
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    };

    prices
      .filter(
        (p) =>
          p.city === city &&
          p.month === monthNum &&
          p.km_from === 1 &&
          p.km_to === 50
      )
      .forEach((p) => {
        routePrices[p.vehicle_type] = p.price.toString();
      });

    setBasePriceValues(routePrices);

    // Also load the currency from existing prices if available
    const existingBasePrice = prices.find(
      (p) =>
        p.city === city &&
        p.month === monthNum &&
        p.km_from === 1 &&
        p.km_to === 50
    );
    if (existingBasePrice) {
      setBasePriceCurrency(existingBasePrice.price_currency);
    }
  };

  const handleBasePriceSave = async () => {
    const hasAnyPrice = Object.values(basePriceValues).some(
      (p) => p && parseFloat(p) > 0
    );
    if (!basePriceCity || !basePriceMonth || !hasAnyPrice) {
      toast.error(
        "Lütfen şehir, ay ve en az bir araç fiyatı girin"
      );
      return;
    }

    setBasePriceSaving(true);
    try {
      const monthNum = parseInt(basePriceMonth);
      let savedCount = 0;

      for (const vehicleType of VEHICLE_TYPES) {
        const priceValue =
          parseFloat(basePriceValues[vehicleType.value] || "0") || 0;

        const existingPrice = prices.find(
          (p) =>
            p.city === basePriceCity &&
            p.month === monthNum &&
            p.km_from === 1 &&
            p.km_to === 50 &&
            p.vehicle_type === vehicleType.value
        );

        if (priceValue > 0) {
          const priceData = {
            city: basePriceCity,
            month: monthNum,
            km_from: 1,
            km_to: 50,
            vehicle_type: vehicleType.value,
            price: priceValue,
            price_currency: basePriceCurrency,
            is_active: true,
          };

          if (existingPrice) {
            const { error } = await supabase
              .from("km_based_prices")
              .update({ ...priceData, updated_at: new Date().toISOString() })
              .eq("id", existingPrice.id);
            if (error) {
              console.error("Base price update error:", error);
              throw new Error(`Güncelleme hatası: ${error.message}`);
            }
            savedCount++;
          } else {
            const { error } = await supabase
              .from("km_based_prices")
              .insert([priceData]);
            if (error) {
              if (error.code === "23505") {
                // Duplicate: update instead
                const { error: updateErr } = await supabase
                  .from("km_based_prices")
                  .update({ price: priceValue, price_currency: basePriceCurrency, is_active: true, updated_at: new Date().toISOString() })
                  .eq("city", basePriceCity)
                  .eq("month", monthNum)
                  .eq("km_from", 1)
                  .eq("km_to", 50)
                  .eq("vehicle_type", vehicleType.value);
                if (updateErr) throw new Error(`Kayıt hatası: ${updateErr.message}`);
              } else {
                console.error("Base price insert error:", error);
                throw new Error(`Ekleme hatası: ${error.message}`);
              }
            }
            savedCount++;
          }
        } else if (existingPrice) {
          await supabase
            .from("km_based_prices")
            .delete()
            .eq("id", existingPrice.id);
        }
      }

      toast.success(`Baz fiyat kaydedildi (${basePriceCity}, 1-50 km, ${savedCount} araç)`);
      setIsBasePriceDialogOpen(false);
      fetchPrices();
    } catch (error: any) {
      console.error("Error saving base price:", error);
      toast.error(error?.message || "Baz fiyat kaydedilirken hata oluştu");
    } finally {
      setBasePriceSaving(false);
    }
  };

  const getVehicleLabel = (type: string) => {
    return VEHICLE_TYPES.find((v) => v.value === type)?.label || type;
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      EUR: "€",
      USD: "$",
      TRY: "₺",
      GBP: "£",
    };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  // Group prices by city/month/km_range for display
  const groupedPrices = useMemo(() => {
    const groups: Record<
      string,
      { key: string; city: string; month: number; km_from: number; km_to: number; prices: KmBasedPrice[] }
    > = {};

    prices.forEach((p) => {
      const key = `${p.city}-${p.month}-${p.km_from}-${p.km_to}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          city: p.city,
          month: p.month,
          km_from: p.km_from,
          km_to: p.km_to,
          prices: [],
        };
      }
      groups[key].prices.push(p);
    });

    return Object.values(groups);
  }, [prices]);

  const filteredGroups = groupedPrices.filter((group) => {
    const matchesSearch =
      !searchTerm ||
      group.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === "all" || group.city === filterCity;
    const matchesMonth =
      filterMonth === "all" || group.month === parseInt(filterMonth);
    return matchesSearch && matchesCity && matchesMonth;
  });

  const setKmRange = (rangeStr: string) => {
    if (rangeStr === "custom") {
      setFormKmFrom("");
      setFormKmTo("");
      return;
    }
    const range = DEFAULT_KM_RANGES.find(
      (r) => `${r.from}-${r.to}` === rangeStr
    );
    if (range) {
      setFormKmFrom(range.from.toString());
      setFormKmTo(range.to.toString());
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Ruler className="h-5 w-5 shrink-0" />
            KM Bazlı Fiyatlandırma
          </CardTitle>
          <CardDescription className="mt-1">
            Şehir, ay ve km aralığına göre fiyat belirleyin. KM fiyatı tüm fiyatlandırma kurallarında en yüksek önceliğe sahiptir.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={openBasePriceDialog}
          >
            <Shield className="h-4 w-4 mr-2 shrink-0" />
            Baz Fiyat (1-50 km)
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={openNewDialog}
          >
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            Yeni KM Fiyatı
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Şehir ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Şehir filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Ay filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Aylar</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          {(filterCity !== "all" || filterMonth !== "all") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Aktif filtreler:
              </span>
              {filterCity !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Şehir: {filterCity}
                  <button
                    onClick={() => setFilterCity("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterMonth !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {MONTHS.find((m) => m.value.toString() === filterMonth)?.label}
                  <button
                    onClick={() => setFilterMonth("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCity("all");
                  setFilterMonth("all");
                  setSearchTerm("");
                }}
              >
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
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {groupedPrices.length === 0
              ? "Henüz KM bazlı fiyat eklenmemiş. Yeni fiyat eklemek için butona tıklayın."
              : "Arama kriterlerine uygun fiyat bulunamadı."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Ay</TableHead>
                    <TableHead>KM Aralığı</TableHead>
                    <TableHead>Araç Fiyatları</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => {
                    const isBasePrice =
                      group.km_from === 1 && group.km_to === 50;
                    return (
                      <TableRow key={group.key}>
                        <TableCell className="font-medium">
                          {group.city}
                        </TableCell>
                        <TableCell>
                          {MONTHS.find((m) => m.value === group.month)?.label}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {group.km_from} - {group.km_to} km
                            </span>
                            {isBasePrice && (
                              <Badge
                                variant="default"
                                className="text-xs bg-amber-500 hover:bg-amber-600"
                              >
                                Baz Fiyat
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {group.prices.map((p) => (
                              <Badge
                                key={p.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {getVehicleLabel(p.vehicle_type).split(' ')[0]}:{" "}
                                {formatPrice(p.price, p.price_currency)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(group.prices[0])}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(group.prices[0])}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
              {filteredGroups.map((group) => {
                const isBasePrice = group.km_from === 1 && group.km_to === 50;
                return (
                  <Card key={group.key} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {group.city}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {MONTHS.find((m) => m.value === group.month)?.label}
                          </Badge>
                          {isBasePrice && (
                            <Badge
                              variant="default"
                              className="text-xs bg-amber-500 hover:bg-amber-600"
                            >
                              Baz Fiyat
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {group.km_from} - {group.km_to} km
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {group.prices.map((p) => (
                            <Badge
                              key={p.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {getVehicleLabel(p.vehicle_type).split(' ')[0]}:{" "}
                              {formatPrice(p.price, p.price_currency)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(group.prices[0])}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(group.prices[0])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          <span>Toplam {filteredGroups.length} KM aralığı kaydı</span>
          <span className="text-xs">
            Baz Fiyat (1-50 km):{" "}
            {
              groupedPrices.filter(
                (g) => g.km_from === 1 && g.km_to === 50
              ).length
            }{" "}
            | Diğer:{" "}
            {
              groupedPrices.filter(
                (g) => !(g.km_from === 1 && g.km_to === 50)
              ).length
            }
          </span>
        </div>
      </CardContent>

      {/* Add/Edit KM Price Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrice ? "KM Fiyat Düzenle" : "Yeni KM Bazlı Fiyat"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* City */}
            <div className="space-y-2">
              <Label>Şehir *</Label>
              <Select
                value={formCity}
                onValueChange={setFormCity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label>Ay *</Label>
              <Select value={formMonth} onValueChange={setFormMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KM Range - Quick select */}
            <div className="space-y-2">
              <Label>KM Aralığı *</Label>
              <Select
                value={
                  formKmFrom && formKmTo
                    ? DEFAULT_KM_RANGES.find(
                        (r) =>
                          r.from.toString() === formKmFrom &&
                          r.to.toString() === formKmTo
                      )
                      ? `${formKmFrom}-${formKmTo}`
                      : "custom"
                    : ""
                }
                onValueChange={setKmRange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="KM aralığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_KM_RANGES.map((range) => (
                    <SelectItem
                      key={`${range.from}-${range.to}`}
                      value={`${range.from}-${range.to}`}
                    >
                      {range.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Özel Aralık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom KM range inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  KM Başlangıç
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formKmFrom}
                  onChange={(e) => setFormKmFrom(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  KM Bitiş
                </Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={formKmTo}
                  onChange={(e) => setFormKmTo(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {/* Vehicle Prices */}
            <div className="space-y-3">
              <Label>Araç Fiyatları *</Label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((v) => (
                  <div key={v.value} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {v.label}
                    </Label>
                    <MoneyInput
                      value={formPrices[v.value]}
                      onValueChange={(val) =>
                        setFormPrices((prev) => ({
                          ...prev,
                          [v.value]: val,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
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
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Base Price (1-50 km) Dialog */}
      <Dialog
        open={isBasePriceDialogOpen}
        onOpenChange={setIsBasePriceDialogOpen}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Sabit Baz Fiyat (1 - 50 km)
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            1 ile 50 km arasındaki sabit baz fiyatı burada belirleyebilirsiniz.
            Bu fiyat, şehir içi kısa mesafe transferlerin temel fiyatını
            oluşturur.
          </p>
          <div className="space-y-4 py-4">
            {/* City */}
            <div className="space-y-2">
              <Label>Şehir *</Label>
              <Select
                value={basePriceCity}
                onValueChange={(val) => {
                  setBasePriceCity(val);
                  if (basePriceMonth) loadBasePrices(val, basePriceMonth);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label>Ay *</Label>
              <Select
                value={basePriceMonth}
                onValueChange={(val) => {
                  setBasePriceMonth(val);
                  if (basePriceCity) loadBasePrices(basePriceCity, val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ay seçin" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KM range info */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Shield className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">
                  KM Aralığı: 1 - 50 km (Sabit)
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Bu aralık sabit baz fiyat olarak kullanılır ve değiştirilemez.
              </p>
            </div>

            {/* Vehicle Prices */}
            <div className="space-y-3">
              <Label>Araç Baz Fiyatları *</Label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((v) => (
                  <div key={v.value} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {v.label}
                    </Label>
                    <MoneyInput
                      value={basePriceValues[v.value]}
                      onValueChange={(val) =>
                        setBasePriceValues((prev) => ({
                          ...prev,
                          [v.value]: val,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select
                value={basePriceCurrency}
                onValueChange={setBasePriceCurrency}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBasePriceDialogOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={handleBasePriceSave} disabled={basePriceSaving}>
              {basePriceSaving ? "Kaydediliyor..." : "Baz Fiyat Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KmBasedPricesManager;
