import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Trash2, RefreshCw, AlertTriangle } from "lucide-react";

type PriceType = "region" | "intercity";

interface BulkDeleteByMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceType: PriceType;
  onSuccess: () => void;
  cities?: string[];
  /** Başlangıç değerleri - filtrelerden geldiğinde önceden doldurulur */
  initialMonth?: string;
  initialYear?: number;
  initialCity?: string;
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

const BulkDeleteByMonthDialog = ({
  open,
  onOpenChange,
  priceType,
  onSuccess,
  cities = [],
  initialMonth,
  initialYear,
  initialCity,
}: BulkDeleteByMonthDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth ?? "");
  const [selectedYear, setSelectedYear] = useState(initialYear ?? currentYear);
  const [filterCity, setFilterCity] = useState(initialCity ?? "all");
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedMonth(initialMonth ?? "");
      setSelectedYear(initialYear ?? currentYear);
      setFilterCity(initialCity ?? "all");
      setPreviewCount(null);
    }
  }, [open, initialMonth, initialYear, initialCity, currentYear]);

  const getTableName = () => {
    return priceType === "region" ? "region_prices" : "intercity_prices";
  };

  const getTitle = () => {
    return priceType === "region"
      ? "Havalimanı Transfer Fiyatları"
      : "Şehirler Arası Fiyatlar";
  };

  const getCityColumn = () => {
    return priceType === "region" ? "city" : "from_city";
  };

  const getFirstDay = () => new Date(selectedYear, parseInt(selectedMonth, 10) - 1, 1);
  const getLastDay = () => new Date(selectedYear, parseInt(selectedMonth, 10), 0);

  const handlePreview = async () => {
    if (!selectedMonth) {
      toast.error("Ay seçin");
      return;
    }

    try {
      const firstDay = getFirstDay();
      const lastDay = getLastDay();
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const lastDayStr = lastDay.toISOString().split("T")[0];

      let query = supabase
        .from(getTableName())
        .select("id", { count: "exact", head: true })
        .not("valid_from", "is", null)
        .not("valid_to", "is", null)
        .lte("valid_from", lastDayStr)
        .gte("valid_to", firstDayStr);

      if (filterCity !== "all") {
        query = query.eq(getCityColumn(), filterCity);
      }

      const { count, error } = await query;

      if (error) throw error;
      setPreviewCount(count ?? 0);
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Önizleme yapılamadı");
    }
  };

  const handleDelete = async () => {
    if (!selectedMonth) {
      toast.error("Ay seçin");
      return;
    }

    const count = previewCount ?? 0;
    if (count === 0) {
      toast.error("Silinecek fiyat bulunamadı");
      return;
    }

    const monthLabel = MONTHS.find((m) => m.value.toString() === selectedMonth)?.label;
    if (
      !confirm(
        `${selectedYear} ${monthLabel} ayına ait ${count} aylık fiyat kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const firstDay = getFirstDay();
      const lastDay = getLastDay();
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const lastDayStr = lastDay.toISOString().split("T")[0];

      let query = supabase
        .from(getTableName())
        .delete()
        .not("valid_from", "is", null)
        .not("valid_to", "is", null)
        .lte("valid_from", lastDayStr)
        .gte("valid_to", firstDayStr);

      if (filterCity !== "all") {
        query = query.eq(getCityColumn(), filterCity);
      }

      const { error } = await query;

      if (error) throw error;

      toast.success(`${count} aylık fiyat kaydı silindi`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Toplu silme başarısız");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMonth("");
    setSelectedYear(currentYear);
    setFilterCity("all");
    setPreviewCount(null);
  };

  const monthChanged = () => setPreviewCount(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Ay Bazlı Toplu Silme - {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Sadece <strong>aylık (sezonluk) fiyatlar</strong> silinir. Temel fiyatlar
              etkilenmez.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ay</Label>
            <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); monthChanged(); }}>
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

          <div className="space-y-2">
            <Label>Yıl</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => { setSelectedYear(parseInt(v)); monthChanged(); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cities.length > 0 && (
            <div className="space-y-2">
              <Label>Şehir Filtresi</Label>
              <Select value={filterCity} onValueChange={(v) => { setFilterCity(v); monthChanged(); }}>
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

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePreview}
            disabled={!selectedMonth}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Önizle
          </Button>

          {previewCount !== null && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-center">
              <p className="font-semibold text-destructive">
                {previewCount === 0 ? (
                  "Bu ay için silinecek aylık fiyat bulunamadı"
                ) : (
                  <>
                    <span className="text-lg">{previewCount}</span> aylık fiyat kaydı
                    silinecek
                  </>
                )}
              </p>
              {previewCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {MONTHS.find((m) => m.value.toString() === selectedMonth)?.label}{" "}
                  {selectedYear}
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
            variant="destructive"
            onClick={handleDelete}
            disabled={
              loading ||
              !selectedMonth ||
              previewCount === null ||
              previewCount === 0
            }
          >
            {loading ? "Siliniyor..." : "Toplu Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteByMonthDialog;
