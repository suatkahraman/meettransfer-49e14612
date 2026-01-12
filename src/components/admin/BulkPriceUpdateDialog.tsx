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
import { Percent, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

type PriceType = "hourly" | "region" | "intercity";

interface BulkPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceType: PriceType;
  onSuccess: () => void;
  cities?: string[];
  vehicleTypes?: { value: string; label: string }[];
}

const BulkPriceUpdateDialog = ({
  open,
  onOpenChange,
  priceType,
  onSuccess,
  cities = [],
  vehicleTypes = [],
}: BulkPriceUpdateDialogProps) => {
  const [percentage, setPercentage] = useState("");
  const [operation, setOperation] = useState<"increase" | "decrease">("increase");
  const [filterCity, setFilterCity] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const getTableName = () => {
    switch (priceType) {
      case "hourly":
        return "hourly_rental_prices";
      case "region":
        return "region_prices";
      case "intercity":
        return "intercity_prices";
    }
  };

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

  const getCityColumn = () => {
    switch (priceType) {
      case "hourly":
      case "region":
        return "city";
      case "intercity":
        return "from_city";
    }
  };

  const handlePreview = async () => {
    if (!percentage || parseFloat(percentage) <= 0) {
      toast.error("Geçerli bir yüzde girin");
      return;
    }

    try {
      let count = 0;
      
      if (priceType === "hourly") {
        let query = supabase.from("hourly_rental_prices").select("id", { count: "exact" });
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      } else if (priceType === "region") {
        let query = supabase.from("region_prices").select("id", { count: "exact" });
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      } else {
        let query = supabase.from("intercity_prices").select("id", { count: "exact" });
        if (filterCity !== "all") query = query.eq("from_city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        count = result.count || 0;
      }

      setPreviewCount(count);
    } catch (error: any) {
      console.error("Preview error:", error);
      toast.error("Önizleme yapılamadı");
    }
  };

  const handleSubmit = async () => {
    if (!percentage || parseFloat(percentage) <= 0) {
      toast.error("Geçerli bir yüzde girin");
      return;
    }

    const confirmMessage = `${previewCount || "Tüm"} fiyatı %${percentage} ${operation === "increase" ? "artırmak" : "azaltmak"} istediğinize emin misiniz?`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);

    try {
      const percentValue = parseFloat(percentage);
      const multiplier = operation === "increase" 
        ? 1 + (percentValue / 100) 
        : 1 - (percentValue / 100);

      let prices: { id: string; price: number }[] = [];

      // Fetch prices based on type
      if (priceType === "hourly") {
        let query = supabase.from("hourly_rental_prices").select("id, price");
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        prices = result.data || [];
      } else if (priceType === "region") {
        let query = supabase.from("region_prices").select("id, price");
        if (filterCity !== "all") query = query.eq("city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        prices = result.data || [];
      } else {
        let query = supabase.from("intercity_prices").select("id, price");
        if (filterCity !== "all") query = query.eq("from_city", filterCity);
        if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
        const result = await query;
        if (result.error) throw result.error;
        prices = result.data || [];
      }

      if (prices.length === 0) {
        toast.warning("Güncellenecek fiyat bulunamadı");
        setLoading(false);
        return;
      }

      // Update each price
      let successCount = 0;
      let errorCount = 0;

      for (const price of prices) {
        const newPrice = Math.round(price.price * multiplier * 100) / 100;
        
        let updateError = null;
        if (priceType === "hourly") {
          const result = await supabase.from("hourly_rental_prices").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", price.id);
          updateError = result.error;
        } else if (priceType === "region") {
          const result = await supabase.from("region_prices").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", price.id);
          updateError = result.error;
        } else {
          const result = await supabase.from("intercity_prices").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", price.id);
          updateError = result.error;
        }

        if (updateError) {
          errorCount++;
          console.error("Update error:", updateError);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} fiyat %${percentage} ${operation === "increase" ? "artırıldı" : "azaltıldı"}`);
        onSuccess();
        onOpenChange(false);
        resetForm();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} fiyat güncellenemedi`);
      }
    } catch (error: any) {
      console.error("Bulk update error:", error);
      toast.error("Toplu güncelleme başarısız: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPercentage("");
    setOperation("increase");
    setFilterCity("all");
    setFilterVehicle("all");
    setPreviewCount(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Toplu Fiyat Güncelleme - {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            disabled={!percentage}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Önizle
          </Button>

          {/* Preview Result */}
          {previewCount !== null && (
            <div className={`p-3 rounded-lg text-center ${operation === "increase" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
              <p className="font-semibold">
                {previewCount} fiyat %{percentage} {operation === "increase" ? "artırılacak" : "azaltılacak"}
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
            disabled={loading || !percentage || previewCount === null || previewCount === 0}
            className={operation === "increase" ? "" : "bg-destructive hover:bg-destructive/90"}
          >
            {loading ? "Güncelleniyor..." : `%${percentage || "0"} ${operation === "increase" ? "Artır" : "Azalt"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPriceUpdateDialog;
