import { useState, useEffect } from "react";
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
import { Percent, TrendingUp, TrendingDown, RefreshCw, Trash2, AlertTriangle } from "lucide-react";

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

type PriceType = "hourly" | "region" | "intercity";

interface BulkPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceType: PriceType;
  onSuccess: () => void;
  cities?: string[];
  vehicleTypes?: { value: string; label: string }[];
  /** Sayfa filtrelerinden gelen başlangıç değerleri */
  initialFilterCity?: string;
  initialFilterMonth?: string;
  initialFilterYear?: number;
}

const BulkPriceUpdateDialog = ({
  open,
  onOpenChange,
  priceType,
  onSuccess,
  cities = [],
  vehicleTypes = [],
  initialFilterCity,
  initialFilterMonth,
  initialFilterYear,
}: BulkPriceUpdateDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [percentage, setPercentage] = useState("");
  const [operation, setOperation] = useState<"increase" | "decrease" | "delete">("increase");
  const [filterCity, setFilterCity] = useState(initialFilterCity ?? "all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [deleteTargetType, setDeleteTargetType] = useState<"seasonal" | "base" | "all">("seasonal");
  const [deleteMonth, setDeleteMonth] = useState<string>(initialFilterMonth ?? "");
  const [deleteYear, setDeleteYear] = useState(initialFilterYear ?? currentYear);
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      if (initialFilterCity !== undefined) setFilterCity(initialFilterCity);
      if (initialFilterMonth !== undefined) setDeleteMonth(initialFilterMonth);
      if (initialFilterYear !== undefined) setDeleteYear(initialFilterYear);
    }
  }, [open, initialFilterCity, initialFilterMonth, initialFilterYear]);

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
    if (operation === "delete") {
      if (deleteTargetType === "seasonal" && !deleteMonth) {
        toast.error("Ay seçin");
        return;
      }
      try {
        let totalCount = 0;

        if (deleteTargetType === "base" || deleteTargetType === "all") {
          let baseQuery = supabase
            .from(getTableName())
            .select("id", { count: "exact", head: true })
            .is("valid_from", null)
            .is("valid_to", null);
          if (filterCity !== "all") baseQuery = baseQuery.eq(getCityColumn(), filterCity);
          if (filterVehicle !== "all") baseQuery = baseQuery.eq("vehicle_type", filterVehicle);
          const { count: baseCount } = await baseQuery;
          totalCount += baseCount ?? 0;
        }

        if (deleteTargetType === "seasonal" || deleteTargetType === "all") {
          if (!deleteMonth) {
            setPreviewCount(totalCount);
            return;
          }
          const firstDay = new Date(deleteYear, parseInt(deleteMonth, 10) - 1, 1);
          const lastDay = new Date(deleteYear, parseInt(deleteMonth, 10), 0);
          const firstDayStr = firstDay.toISOString().split("T")[0];
          const lastDayStr = lastDay.toISOString().split("T")[0];

          let seasonalQuery = supabase
            .from(getTableName())
            .select("id", { count: "exact", head: true })
            .not("valid_from", "is", null)
            .not("valid_to", "is", null)
            .lte("valid_from", lastDayStr)
            .gte("valid_to", firstDayStr);
          if (filterCity !== "all") seasonalQuery = seasonalQuery.eq(getCityColumn(), filterCity);
          if (filterVehicle !== "all") seasonalQuery = seasonalQuery.eq("vehicle_type", filterVehicle);
          const { count: seasonalCount } = await seasonalQuery;
          totalCount += seasonalCount ?? 0;
        }

        setPreviewCount(totalCount);
      } catch (error: any) {
        console.error("Delete preview error:", error);
        toast.error("Önizleme yapılamadı");
      }
      return;
    }

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
    if (operation === "delete") {
      if (deleteTargetType === "seasonal" && !deleteMonth) {
        toast.error("Ay seçin");
        return;
      }
      if ((previewCount ?? 0) === 0) {
        toast.error("Silinecek fiyat bulunamadı");
        return;
      }
      const confirmMsg =
        deleteTargetType === "base"
          ? `${previewCount} temel fiyat kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`
          : deleteTargetType === "seasonal"
            ? `${deleteYear} ${MONTHS.find((m) => m.value.toString() === deleteMonth)?.label} ayına ait ${previewCount} aylık fiyat kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`
            : `${previewCount} fiyat kaydı (temel + aylık) kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`;
      if (!confirm(confirmMsg)) return;

      setLoading(true);
      try {
        if (deleteTargetType === "base" || deleteTargetType === "all") {
          let baseQuery = supabase.from(getTableName()).delete().is("valid_from", null).is("valid_to", null);
          if (filterCity !== "all") baseQuery = baseQuery.eq(getCityColumn(), filterCity);
          if (filterVehicle !== "all") baseQuery = baseQuery.eq("vehicle_type", filterVehicle);
          const { error: baseErr } = await baseQuery;
          if (baseErr) throw baseErr;
        }

        if (deleteTargetType === "seasonal" || deleteTargetType === "all") {
          if (deleteMonth) {
            const firstDay = new Date(deleteYear, parseInt(deleteMonth, 10) - 1, 1);
            const lastDay = new Date(deleteYear, parseInt(deleteMonth, 10), 0);
            const firstDayStr = firstDay.toISOString().split("T")[0];
            const lastDayStr = lastDay.toISOString().split("T")[0];
            let seasonalQuery = supabase
              .from(getTableName())
              .delete()
              .not("valid_from", "is", null)
              .not("valid_to", "is", null)
              .lte("valid_from", lastDayStr)
              .gte("valid_to", firstDayStr);
            if (filterCity !== "all") seasonalQuery = seasonalQuery.eq(getCityColumn(), filterCity);
            if (filterVehicle !== "all") seasonalQuery = seasonalQuery.eq("vehicle_type", filterVehicle);
            const { error: seasonalErr } = await seasonalQuery;
            if (seasonalErr) throw seasonalErr;
          }
        }

        toast.success(`${previewCount} fiyat kaydı silindi`);
        onSuccess();
        onOpenChange(false);
        resetForm();
      } catch (error: any) {
        console.error("Delete error:", error);
        toast.error("Toplu silme başarısız");
      } finally {
        setLoading(false);
      }
      return;
    }

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

      // Fetch ALL prices with pagination to avoid 1000-row limit
      const pageSize = 1000;
      
      const fetchAllRegionPrices = async () => {
        let allPrices: { id: string; price: number }[] = [];
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          let query = supabase
            .from("region_prices")
            .select("id, price")
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (filterCity !== "all") query = query.eq("city", filterCity);
          if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
          
          const { data, error } = await query;
          if (error) throw error;
          
          if (data && data.length > 0) {
            allPrices = [...allPrices, ...data];
            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        return allPrices;
      };

      const fetchAllHourlyPrices = async () => {
        let allPrices: { id: string; price: number }[] = [];
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          let query = supabase
            .from("hourly_rental_prices")
            .select("id, price")
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (filterCity !== "all") query = query.eq("city", filterCity);
          if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
          
          const { data, error } = await query;
          if (error) throw error;
          
          if (data && data.length > 0) {
            allPrices = [...allPrices, ...data];
            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        return allPrices;
      };

      const fetchAllIntercityPrices = async () => {
        let allPrices: { id: string; price: number }[] = [];
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          let query = supabase
            .from("intercity_prices")
            .select("id, price")
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (filterCity !== "all") query = query.eq("from_city", filterCity);
          if (filterVehicle !== "all") query = query.eq("vehicle_type", filterVehicle);
          
          const { data, error } = await query;
          if (error) throw error;
          
          if (data && data.length > 0) {
            allPrices = [...allPrices, ...data];
            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        return allPrices;
      };

      if (priceType === "hourly") {
        prices = await fetchAllHourlyPrices();
      } else if (priceType === "region") {
        prices = await fetchAllRegionPrices();
      } else {
        prices = await fetchAllIntercityPrices();
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
    setDeleteTargetType("seasonal");
    setDeleteMonth("");
    setDeleteYear(currentYear);
    setPreviewCount(null);
  };

  const deleteNeedsMonth = deleteTargetType === "seasonal" || deleteTargetType === "all";
  const deletePreviewDisabled = operation === "delete" && deleteNeedsMonth && !deleteMonth;

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
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={operation === "increase" ? "default" : "outline"}
              onClick={() => { setOperation("increase"); setPreviewCount(null); }}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              Artır
            </Button>
            <Button
              type="button"
              variant={operation === "decrease" ? "destructive" : "outline"}
              onClick={() => { setOperation("decrease"); setPreviewCount(null); }}
              className="flex items-center gap-2"
            >
              <TrendingDown className="h-4 w-4 shrink-0" />
              Azalt
            </Button>
            <Button
              type="button"
              variant={operation === "delete" ? "destructive" : "outline"}
              onClick={() => { setOperation("delete"); setPreviewCount(null); }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Toplu Sil
            </Button>
          </div>

          {operation === "delete" && (
            <>
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {deleteTargetType === "base"
                    ? <>Sadece <strong>temel fiyatlar</strong> silinir.</>
                    : deleteTargetType === "seasonal"
                      ? <>Sadece <strong>aylık (sezonluk) fiyatlar</strong> silinir.</>
                      : <><strong>Temel ve aylık</strong> tüm fiyatlar silinir.</>}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Silinecek Fiyat Tipi</Label>
                <Select value={deleteTargetType} onValueChange={(v) => { setDeleteTargetType(v as "seasonal" | "base" | "all"); setPreviewCount(null); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seasonal">Aylık (sezonluk) fiyatlar</SelectItem>
                    <SelectItem value="base">Temel fiyatlar</SelectItem>
                    <SelectItem value="all">Tümü (temel + aylık)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Percentage Input (sadece Artır/Azalt için) */}
          {operation !== "delete" && (
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
          )}

          {/* Ay/Yıl (sadece Aylık veya Tümü için) */}
          {operation === "delete" && deleteNeedsMonth && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ay</Label>
                <Select value={deleteMonth} onValueChange={(v) => { setDeleteMonth(v); setPreviewCount(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ay seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Yıl</Label>
                <Select value={deleteYear.toString()} onValueChange={(v) => { setDeleteYear(parseInt(v)); setPreviewCount(null); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
            disabled={operation === "delete" ? deletePreviewDisabled : !percentage}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Önizle
          </Button>

          {/* Preview Result */}
          {previewCount !== null && (
            <div className={`p-3 rounded-lg text-center ${
              operation === "delete"
                ? "bg-destructive/10 text-destructive"
                : operation === "increase"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              <p className="font-semibold">
                {operation === "delete"
                  ? (previewCount === 0
                    ? (deleteTargetType === "base" ? "Silinecek temel fiyat bulunamadı" : "Silinecek fiyat bulunamadı")
                    : deleteTargetType === "base"
                      ? `${previewCount} temel fiyat kaydı silinecek`
                      : deleteTargetType === "seasonal"
                        ? `${previewCount} aylık fiyat kaydı silinecek`
                        : `${previewCount} fiyat kaydı silinecek`)
                  : `${previewCount} fiyat %${percentage} ${operation === "increase" ? "artırılacak" : "azaltılacak"}`}
              </p>
              {operation === "delete" && previewCount > 0 && deleteMonth && deleteNeedsMonth && (
                <p className="text-xs mt-1 opacity-80">
                  {MONTHS.find((m) => m.value.toString() === deleteMonth)?.label} {deleteYear}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">İptal</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              (operation === "delete"
                ? (previewCount === null || previewCount === 0 || (deleteNeedsMonth && !deleteMonth))
                : (!percentage || previewCount === null || previewCount === 0))
            }
            variant={operation === "delete" || operation === "decrease" ? "destructive" : "default"}
          >
            {loading
              ? (operation === "delete" ? "Siliniyor..." : "Güncelleniyor...")
              : operation === "delete"
                ? "Toplu Sil"
                : `%${percentage || "0"} ${operation === "increase" ? "Artır" : "Azalt"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPriceUpdateDialog;
