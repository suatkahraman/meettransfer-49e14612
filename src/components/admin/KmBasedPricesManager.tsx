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
import { Plus, Pencil, Trash2, Ruler, Search, Calculator } from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { VEHICLE_TYPE_OPTIONS as VEHICLE_TYPES } from "@/lib/vehicleTypes";

const CURRENCIES = [
  { value: "EUR", label: "€ EUR" },
  { value: "USD", label: "$ USD" },
  { value: "TRY", label: "₺ TRY" },
  { value: "GBP", label: "£ GBP" },
];

interface DistancePricingRule {
  id: string;
  country: string;
  city: string | null;
  month: number | null;
  km_from: number;
  km_to: number;
  vehicle_type: string;
  pricing_mode: string; // 'fixed' | 'per_km'
  price_amount: number;
  price_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KmBasedPricesManagerProps {
  cities: string[];
}

const KmBasedPricesManager = ({ cities }: KmBasedPricesManagerProps) => {
  const [rules, setRules] = useState<DistancePricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVehicle, setFilterVehicle] = useState<string>("all");

  // Add/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DistancePricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [formCountry, setFormCountry] = useState("TR");
  const [formCity, setFormCity] = useState<string>("");
  const [formKmFrom, setFormKmFrom] = useState("");
  const [formKmTo, setFormKmTo] = useState("");
  const [formPricingMode, setFormPricingMode] = useState<string>("fixed");
  const [formCurrency, setFormCurrency] = useState("EUR");
  // Per-vehicle price amounts
  const [formAmounts, setFormAmounts] = useState<Record<string, string>>({});

  // Test calculator
  const [testDistance, setTestDistance] = useState("");
  const [testVehicle, setTestVehicle] = useState("mercedes-vito");
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("distance_pricing_rules")
        .select("*")
        .order("country")
        .order("km_from", { ascending: true })
        .order("vehicle_type");

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error("Error fetching distance pricing rules:", error);
      toast.error("KM fiyat kuralları yüklenirken hata: " + (error?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // Group rules by country/city/kmRange/mode for display
  const groupedRules = useMemo(() => {
    const groups: Record<string, {
      key: string;
      country: string;
      city: string | null;
      km_from: number;
      km_to: number;
      pricing_mode: string;
      rules: DistancePricingRule[];
    }> = {};

    rules.forEach((r) => {
      const key = `${r.country}-${r.city || "ALL"}-${r.km_from}-${r.km_to}-${r.pricing_mode}`;
      if (!groups[key]) {
        groups[key] = { key, country: r.country, city: r.city, km_from: r.km_from, km_to: r.km_to, pricing_mode: r.pricing_mode, rules: [] };
      }
      groups[key].rules.push(r);
    });

    return Object.values(groups);
  }, [rules]);

  const filteredGroups = groupedRules.filter((g) => {
    if (filterVehicle === "all") return true;
    return g.rules.some((r) => r.vehicle_type === filterVehicle);
  });

  const getVehicleLabel = (type: string) =>
    VEHICLE_TYPES.find((v) => v.value === type)?.label || type;

  const formatAmount = (amount: number, currency: string, mode: string) => {
    const sym: Record<string, string> = { EUR: "€", USD: "$", TRY: "₺", GBP: "£" };
    const s = sym[currency] || currency;
    if (mode === "per_km") return `+${s}${amount}/km`;
    return `${s}${amount}`;
  };

  // ---- Add / Edit ----
  const resetForm = () => {
    setEditingRule(null);
    setFormCountry("TR");
    setFormCity("");
    setFormKmFrom("");
    setFormKmTo("");
    setFormPricingMode("fixed");
    setFormCurrency("EUR");
    setFormAmounts({});
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (group: typeof groupedRules[0]) => {
    setEditingRule(group.rules[0]);
    setFormCountry(group.country);
    setFormCity(group.city || "");
    setFormKmFrom(group.km_from.toString());
    setFormKmTo(group.km_to.toString());
    setFormPricingMode(group.pricing_mode);
    setFormCurrency(group.rules[0]?.price_currency || "EUR");
    const amounts: Record<string, string> = {};
    group.rules.forEach((r) => { amounts[r.vehicle_type] = r.price_amount.toString(); });
    setFormAmounts(amounts);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const hasAny = Object.values(formAmounts).some((v) => v && parseFloat(v) > 0);
    if (!formCountry || !formKmFrom || !formKmTo || !formPricingMode || !hasAny) {
      toast.error("Lütfen tüm zorunlu alanları doldurun ve en az bir araç fiyatı girin");
      return;
    }
    const kmFrom = parseInt(formKmFrom);
    const kmTo = parseInt(formKmTo);
    if (isNaN(kmFrom) || isNaN(kmTo) || kmTo <= kmFrom) {
      toast.error("KM bitiş değeri başlangıçtan büyük olmalı");
      return;
    }

    setSaving(true);
    try {
      let saved = 0;
      for (const vt of VEHICLE_TYPES) {
        const amount = parseFloat(formAmounts[vt.value] || "0") || 0;
        const existing = rules.find(
          (r) =>
            r.country === formCountry &&
            (r.city || "") === (formCity || "") &&
            r.km_from === kmFrom &&
            r.km_to === kmTo &&
            r.pricing_mode === formPricingMode &&
            r.vehicle_type === vt.value
        );

        if (amount > 0) {
          const row = {
            country: formCountry,
            city: formCity || null,
            month: null as number | null,
            km_from: kmFrom,
            km_to: kmTo,
            vehicle_type: vt.value,
            pricing_mode: formPricingMode,
            price_amount: amount,
            price_currency: formCurrency,
            is_active: true,
          };

          if (existing) {
            const { error } = await supabase
              .from("distance_pricing_rules")
              .update({ ...row, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            if (error) throw new Error(error.message);
          } else {
            const { error } = await supabase
              .from("distance_pricing_rules")
              .insert([row]);
            if (error) throw new Error(error.message);
          }
          saved++;
        } else if (existing) {
          await supabase.from("distance_pricing_rules").delete().eq("id", existing.id);
        }
      }

      toast.success(`${saved} araç kuralı kaydedildi (${kmFrom}-${kmTo} km, ${formPricingMode === "fixed" ? "sabit" : "km başı"})`);
      setIsDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Kayıt hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group: typeof groupedRules[0]) => {
    if (!confirm(`${group.km_from}-${group.km_to} km ${group.pricing_mode === "fixed" ? "sabit" : "km başı"} kuralını silmek istediğinize emin misiniz?`)) return;
    try {
      for (const r of group.rules) {
        await supabase.from("distance_pricing_rules").delete().eq("id", r.id);
      }
      toast.success("Kural silindi");
      fetchRules();
    } catch (error: any) {
      toast.error("Silme hatası: " + (error?.message || ""));
    }
  };

  // ---- Test Calculator ----
  const runTest = () => {
    const dist = parseInt(testDistance);
    if (!dist || dist <= 0) { toast.error("Geçerli bir mesafe girin"); return; }

    // Filter rules for test vehicle
    const vehicleRules = rules.filter(
      (r) => r.vehicle_type === testVehicle && r.is_active && r.country === "TR"
    );
    const fixedRule = vehicleRules.find((r) => r.pricing_mode === "fixed");
    if (!fixedRule) { setTestResult("Bu araç için sabit baz fiyat kuralı bulunamadı."); return; }

    const maxKm = Math.max(...vehicleRules.map((r) => r.km_to));
    if (dist > maxKm) {
      setTestResult(`${dist} km > max tier (${maxKm} km) → Mevcut intercity/region fallback fiyatı kullanılır.`);
      return;
    }

    let total = fixedRule.price_amount;
    const baseKmTo = fixedRule.km_to;
    const parts: string[] = [`Baz (1-${baseKmTo} km): ${fixedRule.price_currency === "EUR" ? "€" : fixedRule.price_currency}${fixedRule.price_amount}`];

    if (dist > baseKmTo) {
      const tiers = vehicleRules
        .filter((r) => r.pricing_mode === "per_km")
        .sort((a, b) => a.km_from - b.km_from);

      for (const tier of tiers) {
        if (dist < tier.km_from) break;
        const from = Math.max(tier.km_from, baseKmTo + 1);
        const to = Math.min(dist, tier.km_to);
        if (to >= from) {
          const kmCount = to - from + 1;
          const surcharge = Math.round(kmCount * tier.price_amount * 100) / 100;
          total += surcharge;
          const sym = tier.price_currency === "EUR" ? "€" : tier.price_currency;
          parts.push(`${tier.km_from}-${tier.km_to} km: ${kmCount} km × ${sym}${tier.price_amount} = ${sym}${surcharge}`);
        }
      }
    }

    total = Math.round(total * 100) / 100;
    const sym = fixedRule.price_currency === "EUR" ? "€" : fixedRule.price_currency;
    setTestResult(`${getVehicleLabel(testVehicle)} | ${dist} km\n${parts.join("\n")}\n───────────────\nToplam: ${sym}${total}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Ruler className="h-5 w-5 shrink-0" />
            KM Bazlı Fiyatlandırma Kuralları
          </CardTitle>
          <CardDescription className="mt-1">
            Türkiye için mesafe bazlı fiyat kuralları. Sabit baz fiyat + km başı ek ücret tiers.
            Bu fiyat tüm diğer fiyatlandırma tablolarından önceliklidir.
          </CardDescription>
        </div>
        <Button size="sm" onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kural
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Araç filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Araçlar</SelectItem>
              {VEHICLE_TYPES.map((v) => (
                <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rules Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Henüz KM fiyat kuralı yok. Migration çalıştırıldıktan sonra varsayılan TR kuralları otomatik oluşturulacaktır.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ülke</TableHead>
                    <TableHead>KM Aralığı</TableHead>
                    <TableHead>Mod</TableHead>
                    <TableHead>Araç Fiyatları</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((g) => (
                    <TableRow key={g.key}>
                      <TableCell className="font-medium">
                        {g.country}{g.city ? ` / ${g.city}` : ""}
                      </TableCell>
                      <TableCell>{g.km_from} – {g.km_to} km</TableCell>
                      <TableCell>
                        <Badge variant={g.pricing_mode === "fixed" ? "default" : "secondary"}>
                          {g.pricing_mode === "fixed" ? "Sabit Fiyat" : "KM Başı Ek"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.rules
                            .filter((r) => filterVehicle === "all" || r.vehicle_type === filterVehicle)
                            .map((r) => (
                              <Badge key={r.id} variant="outline" className="text-xs">
                                {getVehicleLabel(r.vehicle_type).split(" ")[0]}:{" "}
                                {formatAmount(r.price_amount, r.price_currency, r.pricing_mode)}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteGroup(g)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {filteredGroups.map((g) => (
                <Card key={g.key} className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{g.country}{g.city ? ` / ${g.city}` : ""}</span>
                        <Badge variant={g.pricing_mode === "fixed" ? "default" : "secondary"} className="text-xs">
                          {g.pricing_mode === "fixed" ? "Sabit" : "+/km"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{g.km_from} – {g.km_to} km</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {g.rules.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-xs">
                            {getVehicleLabel(r.vehicle_type).split(" ")[0]}: {formatAmount(r.price_amount, r.price_currency, r.pricing_mode)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(g)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGroup(g)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Test Calculator */}
        <div className="mt-6 p-4 rounded-lg border bg-muted/30">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4" /> Fiyat Hesaplama Testi
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="number"
              placeholder="Mesafe (km)"
              value={testDistance}
              onChange={(e) => setTestDistance(e.target.value)}
              className="w-full sm:w-[140px]"
            />
            <Select value={testVehicle} onValueChange={setTestVehicle}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runTest} variant="outline" size="sm">Hesapla</Button>
          </div>
          {testResult && (
            <pre className="mt-3 p-3 rounded bg-background text-sm whitespace-pre-wrap font-mono">{testResult}</pre>
          )}
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Kural Düzenle" : "Yeni KM Fiyat Kuralı"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ülke *</Label>
                <Select value={formCountry} onValueChange={setFormCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TR">Türkiye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Şehir (boş = tüm ülke)</Label>
                <Select value={formCity || "__all__"} onValueChange={(v) => setFormCity(v === "__all__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm Şehirler</SelectItem>
                    {cities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fiyat Modu *</Label>
              <Select value={formPricingMode} onValueChange={setFormPricingMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Sabit Fiyat (baz fiyat)</SelectItem>
                  <SelectItem value="per_km">KM Başı Ek Ücret (+€/km)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">KM Başlangıç *</Label>
                <Input type="number" placeholder="1" value={formKmFrom} onChange={(e) => setFormKmFrom(e.target.value)} min="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">KM Bitiş *</Label>
                <Input type="number" placeholder="50" value={formKmTo} onChange={(e) => setFormKmTo(e.target.value)} min="1" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>{formPricingMode === "fixed" ? "Araç Sabit Fiyatları *" : "Araç KM Başı Ek Ücretleri *"}</Label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((v) => (
                  <div key={v.value} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{v.label}</Label>
                    <MoneyInput
                      value={formAmounts[v.value] || ""}
                      onValueChange={(val) => setFormAmounts((prev) => ({ ...prev, [v.value]: val }))}
                      placeholder={formPricingMode === "fixed" ? "50" : "1.30"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KmBasedPricesManager;
