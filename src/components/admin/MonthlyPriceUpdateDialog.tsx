import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, TrendingUp, TrendingDown, RefreshCw, Percent } from "lucide-react";
import { format, endOfMonth } from "date-fns";

type PriceType = "hourly" | "region" | "intercity";

interface MonthlyPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceType: PriceType;
  onSuccess: () => void;
  cities?: string[];
  vehicleTypes?: { value: string; label: string }[];
}

// Turkish month names
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

const MonthlyPriceUpdateDialog = ({
  open,
  onOpenChange,
  priceType,
  onSuccess,
  cities = [],
  vehicleTypes = [],
}: MonthlyPriceUpdateDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [percentage, setPercentage] = useState("");
  const [operation, setOperation] = useState<"increase" | "decrease">("increase");
  const [filterCity, setFilterCity] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const getTitle = () => {
    switch (priceType) {
      case "hourly":
        return "Saatlik Kiralama Fiyatları";
      case "region":
        return "Şehir İçi Transfer Fiyatları";
      case "intercity":
        return "Şehirler Arası Fiyatlar";
    }
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
    setPreviewCount(null);
  };

  const selectAllMonths = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
    setPreviewCount(null);
  };

  const handlePreview = async () => {
    if (!percentage || parseFloat(percentage) <= 0) {
      toast.error("Geçerli bir yüzde girin");
      return;
    }

    if (selectedMonths.length === 0) {
      toast.error("En az bir ay seçin");
      return;
    }

    try {
      let count = 0;
      
      if (priceType === "region") {
        let query = supabase.from("region_prices").select("id", { count: "exact" }).is("valid_from", null);
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      } else if (priceType === "intercity") {
        let query = supabase.from("intercity_prices").select("id", { count: "exact" }).is("valid_from", null);
        if (filterCity !== "all") query = query.eq("from_city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      } else {
        let query = supabase.from("hourly_rental_prices").select("id", { count: "exact" }).is("valid_from", null);
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      }

      setPreviewCount(count);
    } catch (error: unknown) {
      console.error("Preview error:", error);
      toast.error("Önizleme yapılamadı");
    }
  };

  const handleSubmit = async () => {
    if (!percentage || parseFloat(percentage) <= 0) {
      toast.error("Geçerli bir yüzde girin");
      return;
    }

    if (selectedMonths.length === 0) {
      toast.error("En az bir ay seçin");
      return;
    }

    const monthNames = selectedMonths.map(m => MONTHS.find(month => month.value === m)?.label).join(", ");
    const confirmMessage = `${previewCount || "Seçili"} fiyat için ${selectedYear} ${monthNames} aylarına özel sezonluk fiyatlar oluşturulacak. Devam etmek istiyor musunuz?`;
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);

    try {
      const percentValue = parseFloat(percentage);
      const multiplier = operation === "increase" 
        ? 1 + (percentValue / 100) 
        : 1 - (percentValue / 100);

      let successCount = 0;
      let errorCount = 0;

      if (priceType === "region") {
        // Fetch region prices
        let query = supabase.from("region_prices").select("*").is("valid_from", null);
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        const basePrices = result.data || [];

        for (const month of selectedMonths) {
          const validFrom = new Date(selectedYear, month - 1, 1);
          const validTo = endOfMonth(validFrom);
          const validFromStr = format(validFrom, "yyyy-MM-dd");
          const validToStr = format(validTo, "yyyy-MM-dd");

          for (const basePrice of basePrices) {
            const newPrice = Math.round(basePrice.price * multiplier * 100) / 100;
            
            // Check existing
            let existingQuery = supabase.from("region_prices").select("id")
              .eq("city", basePrice.city)
              .eq("district", basePrice.district)
              .eq("vehicle_type", basePrice.vehicle_type)
              .eq("valid_from", validFromStr)
              .eq("valid_to", validToStr);
            
            if (basePrice.airport) {
              existingQuery = existingQuery.eq("airport", basePrice.airport);
            } else {
              existingQuery = existingQuery.is("airport", null);
            }

            const existingResult = await existingQuery.maybeSingle();
            
            if (existingResult.data) {
              const updateResult = await supabase
                .from("region_prices")
                .update({ price: newPrice, updated_at: new Date().toISOString() })
                .eq("id", existingResult.data.id);
              if (updateResult.error) errorCount++; else successCount++;
            } else {
              const insertResult = await supabase
                .from("region_prices")
                .insert({
                  city: basePrice.city,
                  airport: basePrice.airport,
                  district: basePrice.district,
                  vehicle_type: basePrice.vehicle_type,
                  price: newPrice,
                  price_currency: basePrice.price_currency,
                  is_active: true,
                  valid_from: validFromStr,
                  valid_to: validToStr,
                });
              if (insertResult.error) errorCount++; else successCount++;
            }
          }
        }
      } else if (priceType === "intercity") {
        // Fetch intercity prices
        let query = supabase.from("intercity_prices").select("*").is("valid_from", null);
        if (filterCity !== "all") query = query.eq("from_city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        const basePrices = result.data || [];

        for (const month of selectedMonths) {
          const validFrom = new Date(selectedYear, month - 1, 1);
          const validTo = endOfMonth(validFrom);
          const validFromStr = format(validFrom, "yyyy-MM-dd");
          const validToStr = format(validTo, "yyyy-MM-dd");

          for (const basePrice of basePrices) {
            const newPrice = Math.round(basePrice.price * multiplier * 100) / 100;
            
            let existingQuery = supabase.from("intercity_prices").select("id")
              .eq("from_city", basePrice.from_city)
              .eq("to_city", basePrice.to_city)
              .eq("vehicle_type", basePrice.vehicle_type)
              .eq("valid_from", validFromStr)
              .eq("valid_to", validToStr);

            if (basePrice.from_district) {
              existingQuery = existingQuery.eq("from_district", basePrice.from_district);
            } else {
              existingQuery = existingQuery.is("from_district", null);
            }
            if (basePrice.to_district) {
              existingQuery = existingQuery.eq("to_district", basePrice.to_district);
            } else {
              existingQuery = existingQuery.is("to_district", null);
            }

            const existingResult = await existingQuery.maybeSingle();
            
            if (existingResult.data) {
              const updateResult = await supabase
                .from("intercity_prices")
                .update({ price: newPrice, updated_at: new Date().toISOString() })
                .eq("id", existingResult.data.id);
              if (updateResult.error) errorCount++; else successCount++;
            } else {
              const insertResult = await supabase
                .from("intercity_prices")
                .insert({
                  from_city: basePrice.from_city,
                  from_district: basePrice.from_district,
                  to_city: basePrice.to_city,
                  to_district: basePrice.to_district,
                  vehicle_type: basePrice.vehicle_type,
                  price: newPrice,
                  price_currency: basePrice.price_currency,
                  is_active: true,
                  valid_from: validFromStr,
                  valid_to: validToStr,
                });
              if (insertResult.error) errorCount++; else successCount++;
            }
          }
        }
      } else {
        // Hourly prices
        let query = supabase.from("hourly_rental_prices").select("*").is("valid_from", null);
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        const basePrices = result.data || [];

        for (const month of selectedMonths) {
          const validFrom = new Date(selectedYear, month - 1, 1);
          const validTo = endOfMonth(validFrom);
          const validFromStr = format(validFrom, "yyyy-MM-dd");
          const validToStr = format(validTo, "yyyy-MM-dd");

          for (const basePrice of basePrices) {
            const newPrice = Math.round(basePrice.price * multiplier * 100) / 100;
            
            const existingQuery = supabase.from("hourly_rental_prices").select("id")
              .eq("city", basePrice.city)
              .eq("duration_type", basePrice.duration_type)
              .eq("vehicle_type", basePrice.vehicle_type)
              .eq("valid_from", validFromStr)
              .eq("valid_to", validToStr);

            const existingResult = await existingQuery.maybeSingle();
            
            if (existingResult.data) {
              const updateResult = await supabase
                .from("hourly_rental_prices")
                .update({ price: newPrice, updated_at: new Date().toISOString() })
                .eq("id", existingResult.data.id);
              if (updateResult.error) errorCount++; else successCount++;
            } else {
              const insertResult = await supabase
                .from("hourly_rental_prices")
                .insert({
                  city: basePrice.city,
                  duration_type: basePrice.duration_type,
                  vehicle_type: basePrice.vehicle_type,
                  price: newPrice,
                  price_currency: basePrice.price_currency,
                  hourly_rate: basePrice.hourly_rate ? Math.round(basePrice.hourly_rate * multiplier * 100) / 100 : null,
                  is_active: true,
                  valid_from: validFromStr,
                  valid_to: validToStr,
                });
              if (insertResult.error) errorCount++; else successCount++;
            }
          }
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} sezonluk fiyat oluşturuldu/güncellendi`);
        onSuccess();
        onOpenChange(false);
        resetForm();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} fiyat işlenemedi`);
      }
    } catch (error: unknown) {
      console.error("Monthly update error:", error);
      toast.error("Aylık güncelleme başarısız");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPercentage("");
    setOperation("increase");
    setFilterCity("all");
    setFilterVehicle("all");
    setSelectedMonths([]);
    setSelectedYear(currentYear);
    setPreviewCount(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aylık Fiyat Güncelleme - {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label>Yıl</Label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear + 1, currentYear + 2].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Aylar</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={selectAllMonths}
              >
                {selectedMonths.length === 12 ? "Hiçbirini Seçme" : "Tümünü Seç"}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map(month => (
                <Button
                  key={month.value}
                  type="button"
                  variant={selectedMonths.includes(month.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleMonth(month.value)}
                  className="text-xs"
                >
                  {month.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Operation Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={operation === "increase" ? "default" : "outline"}
              onClick={() => setOperation("increase")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Artır
            </Button>
            <Button
              type="button"
              variant={operation === "decrease" ? "destructive" : "outline"}
              onClick={() => setOperation("decrease")}
              className="flex items-center gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Azalt
            </Button>
          </div>

          {/* Percentage Input */}
          <div className="space-y-2">
            <Label>Yüzde Oranı (%)</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Örn: 10"
                value={percentage}
                onChange={(e) => {
                  setPercentage(e.target.value);
                  setPreviewCount(null);
                }}
                min="0"
                max="100"
                step="0.1"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* City Filter */}
          {cities.length > 0 && (
            <div className="space-y-2">
              <Label>Şehir Filtresi</Label>
              <Select value={filterCity} onValueChange={(v) => { setFilterCity(v); setPreviewCount(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm şehirler" />
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
            </div>
          )}

          {/* Vehicle Filter */}
          {vehicleTypes.length > 0 && (
            <div className="space-y-2">
              <Label>Araç Tipi Filtresi</Label>
              <Select value={filterVehicle} onValueChange={(v) => { setFilterVehicle(v); setPreviewCount(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm araçlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Araçlar</SelectItem>
                  {vehicleTypes.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePreview}
            disabled={!percentage || selectedMonths.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Önizle
          </Button>

          {/* Preview Result */}
          {previewCount !== null && (
            <div className={`p-3 rounded-lg text-center ${operation === "increase" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
              <p className="font-semibold">
                {previewCount} temel fiyat için {selectedMonths.length} ay boyunca sezonluk fiyatlar {operation === "increase" ? "artırılarak" : "azaltılarak"} oluşturulacak
              </p>
              <p className="text-sm mt-1">
                Toplam {previewCount * selectedMonths.length} sezonluk fiyat kaydı
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">İptal</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={loading || !percentage || selectedMonths.length === 0 || previewCount === null || previewCount === 0}
            className={operation === "increase" ? "" : "bg-destructive hover:bg-destructive/90"}
          >
            {loading ? "İşleniyor..." : `Sezonluk Fiyatları Oluştur`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyPriceUpdateDialog;
