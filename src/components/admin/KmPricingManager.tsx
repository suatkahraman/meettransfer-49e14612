import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALL_CITIES_VALUE = "__all_cities__";
const ALL_MONTHS_VALUE = "__all_months__";
const ALL_VEHICLES_VALUE = "__all__";

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

type VehicleOption = { value: string; label: string };
type CurrencyOption = { value: string; label: string };

type DistancePricingRule = {
  id: string;
  city: string | null;
  country: string;
  month: number | null;
  km_from: number;
  km_to: number;
  vehicle_type: string;
  pricing_mode: string;
  price_amount: number;
  price_currency: string;
  is_active: boolean;
};

interface KmPricingManagerProps {
  cities: string[];
  vehicleTypes: VehicleOption[];
  currencies: CurrencyOption[];
}

const KmPricingManager = ({ cities, vehicleTypes, currencies }: KmPricingManagerProps) => {
  const [rules, setRules] = useState<DistancePricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DistancePricingRule | null>(null);

  const [filterCity, setFilterCity] = useState<string>(ALL_CITIES_VALUE);
  const [filterMonth, setFilterMonth] = useState<string>(ALL_MONTHS_VALUE);

  const [formCity, setFormCity] = useState<string>(ALL_CITIES_VALUE);
  const [formMonth, setFormMonth] = useState<string>(ALL_MONTHS_VALUE);
  const [formKmFrom, setFormKmFrom] = useState<string>("");
  const [formKmTo, setFormKmTo] = useState<string>("");
  const [formVehicleType, setFormVehicleType] = useState<string>("mercedes-vito");
  const [formPricingMode, setFormPricingMode] = useState<string>("flat_base");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formCurrency, setFormCurrency] = useState<string>("EUR");

  const monthLabelMap = useMemo(() => new Map(MONTHS.map((m) => [m.value, m.label])), []);
  const vehicleLabelMap = useMemo(
    () => new Map(vehicleTypes.map((vehicle) => [vehicle.value, vehicle.label])),
    [vehicleTypes],
  );

  const resetForm = () => {
    setEditingRule(null);
    setFormCity(ALL_CITIES_VALUE);
    setFormMonth(ALL_MONTHS_VALUE);
    setFormKmFrom("");
    setFormKmTo("");
    setFormVehicleType("mercedes-vito");
    setFormPricingMode("flat_base");
    setFormAmount("");
    setFormCurrency("EUR");
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("distance_pricing_rules")
        .select("*")
        .eq("country", "TR")
        .eq("is_active", true)
        .order("city", { ascending: true })
        .order("month", { ascending: true })
        .order("km_from", { ascending: true });
      if (error) throw error;
      setRules((data || []) as DistancePricingRule[]);
    } catch (error) {
      console.error("Error loading KM pricing rules:", error);
      toast.error("KM fiyat kuralları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (rule: DistancePricingRule) => {
    setEditingRule(rule);
    setFormCity(rule.city || ALL_CITIES_VALUE);
    setFormMonth(rule.month ? String(rule.month) : ALL_MONTHS_VALUE);
    setFormKmFrom(String(rule.km_from));
    setFormKmTo(String(rule.km_to));
    setFormVehicleType(rule.vehicle_type || ALL_VEHICLES_VALUE);
    setFormPricingMode(rule.pricing_mode || "flat_base");
    setFormAmount(String(rule.price_amount));
    setFormCurrency(rule.price_currency || "EUR");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const kmFrom = Number(formKmFrom);
    const kmTo = Number(formKmTo);
    const amount = Number(formAmount);

    if (!Number.isFinite(kmFrom) || !Number.isFinite(kmTo) || kmFrom < 1 || kmTo < kmFrom) {
      toast.error("KM aralığını doğru girin");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Geçerli bir fiyat girin");
      return;
    }
    if (formPricingMode === "flat_base" && formVehicleType === ALL_VEHICLES_VALUE) {
      toast.error("Sabit baz fiyat için araç tipi seçmelisiniz");
      return;
    }

    const payload = {
      country: "TR",
      city: formCity === ALL_CITIES_VALUE ? null : formCity,
      month: formMonth === ALL_MONTHS_VALUE ? null : Number(formMonth),
      km_from: kmFrom,
      km_to: kmTo,
      vehicle_type: formVehicleType,
      pricing_mode: formPricingMode,
      price_amount: amount,
      price_currency: formCurrency,
      is_active: true,
    };

    setSaving(true);
    try {
      if (editingRule) {
        const { error } = await supabase
          .from("distance_pricing_rules")
          .update(payload)
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("distance_pricing_rules").insert([payload]);
        if (error) throw error;
      }

      toast.success("KM kuralı kaydedildi");
      setDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error("Error saving KM pricing rule:", error);
      toast.error("KM kuralı kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu KM kuralını silmek istediğinizden emin misiniz?")) return;
    try {
      const { error } = await supabase.from("distance_pricing_rules").delete().eq("id", id);
      if (error) throw error;
      toast.success("KM kuralı silindi");
      fetchRules();
    } catch (error) {
      console.error("Error deleting KM pricing rule:", error);
      toast.error("KM kuralı silinemedi");
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const cityOk = filterCity === ALL_CITIES_VALUE || rule.city === filterCity;
      const monthOk = filterMonth === ALL_MONTHS_VALUE || String(rule.month || "") === filterMonth;
      return cityOk && monthOk;
    });
  }, [rules, filterCity, filterMonth]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>KM Bazlı Fiyat Kuralları (Türkiye)</CardTitle>
          <CardDescription>
            Şehir, ay ve KM aralığına göre baz fiyat/per-km kuralı tanımlayın.
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              KM Kuralı Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRule ? "KM Kuralını Düzenle" : "Yeni KM Kuralı"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Select value={formCity} onValueChange={setFormCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Şehirler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CITIES_VALUE}>Tüm Şehirler</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Select value={formMonth} onValueChange={setFormMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Aylar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_MONTHS_VALUE}>Tüm Aylar</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={String(month.value)}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>KM Başlangıç *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formKmFrom}
                    onChange={(event) => setFormKmFrom(event.target.value)}
                    placeholder="51"
                  />
                </div>
                <div className="space-y-2">
                  <Label>KM Bitiş *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formKmTo}
                    onChange={(event) => setFormKmTo(event.target.value)}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fiyat Tipi *</Label>
                  <Select value={formPricingMode} onValueChange={setFormPricingMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat_base">Sabit Baz Fiyat</SelectItem>
                      <SelectItem value="incremental_per_km">KM Başına Ek Fiyat</SelectItem>
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
                      <SelectItem value={ALL_VEHICLES_VALUE}>Tüm Araçlar (Ortak)</SelectItem>
                      {vehicleTypes.map((vehicle) => (
                        <SelectItem key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fiyat *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formAmount}
                    onChange={(event) => setFormAmount(event.target.value)}
                    placeholder="1.30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Select value={formCurrency} onValueChange={setFormCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Şehir filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES_VALUE}>Tüm Şehirler</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ay filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MONTHS_VALUE}>Tüm Aylar</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Henüz KM kuralı yok veya filtreye uygun kayıt bulunamadı.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Ay</TableHead>
                    <TableHead>KM Aralığı</TableHead>
                    <TableHead>Fiyat Tipi</TableHead>
                    <TableHead>Araç</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.city || "Tüm Şehirler"}</TableCell>
                      <TableCell>{rule.month ? monthLabelMap.get(rule.month) : "Tüm Aylar"}</TableCell>
                      <TableCell>
                        {rule.km_from} - {rule.km_to} km
                      </TableCell>
                      <TableCell>
                        {rule.pricing_mode === "flat_base" ? (
                          <Badge variant="secondary">Sabit Baz</Badge>
                        ) : (
                          <Badge variant="outline">KM Başına</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {rule.vehicle_type === ALL_VEHICLES_VALUE
                          ? "Tüm Araçlar"
                          : vehicleLabelMap.get(rule.vehicle_type) || rule.vehicle_type}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Number(rule.price_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {rule.price_currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(rule.id)}
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

            <div className="space-y-3 md:hidden">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-sm font-medium">{rule.city || "Tüm Şehirler"}</div>
                      <div className="text-xs text-muted-foreground">
                        {rule.month ? monthLabelMap.get(rule.month) : "Tüm Aylar"} · {rule.km_from}-{rule.km_to} km
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rule.vehicle_type === ALL_VEHICLES_VALUE
                          ? "Tüm Araçlar"
                          : vehicleLabelMap.get(rule.vehicle_type) || rule.vehicle_type}
                      </div>
                      <div className="pt-1 text-sm font-semibold">
                        {Number(rule.price_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {rule.price_currency}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KmPricingManager;
