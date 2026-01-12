import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Clock, Car, MapPin, Euro, DollarSign, PoundSterling, Percent } from "lucide-react";
import BulkPriceUpdateDialog from "@/components/admin/BulkPriceUpdateDialog";

interface HourlyRentalPrice {
  id: string;
  city: string;
  vehicle_type: string;
  duration_type: string;
  price: number;
  price_currency: string;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const vehicleTypes = [
  { value: "vito", label: "Mercedes Vito" },
  { value: "vito_vip", label: "Mercedes Vito VIP" },
  { value: "maybach", label: "Mercedes Maybach" },
  { value: "sprinter", label: "Mercedes Sprinter" },
];

const durationTypes = [
  { value: "4h", label: "4 Saat (Yarım Gün)" },
  { value: "6h", label: "6 Saat" },
  { value: "8h", label: "8 Saat (Tam Gün)" },
  { value: "9h", label: "9 Saat" },
  { value: "10h", label: "10 Saat" },
  { value: "12h", label: "12 Saat" },
  { value: "daily", label: "Günlük (24 Saat)" },
  { value: "custom", label: "Özel (Saatlik)" },
];

const currencies = [
  { value: "EUR", label: "Euro (€)", icon: Euro },
  { value: "USD", label: "Dolar ($)", icon: DollarSign },
  { value: "GBP", label: "Sterlin (£)", icon: PoundSterling },
];

const defaultCities = [
  "Istanbul",
  "Antalya",
  "Bodrum",
  "Dalaman",
  "Izmir",
  "Cappadocia",
  "Bursa",
  "Dubai",
  "Cyprus",
];

const AdminHourlyRentalPrices = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [prices, setPrices] = useState<HourlyRentalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<HourlyRentalPrice | null>(null);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    city: "",
    vehicle_type: "vito",
    duration_type: "4h",
    price: "",
    price_currency: "EUR",
    hourly_rate: "",
    is_active: true,
  });

  // Bulk form state - all 4 vehicles at once
  const [bulkFormData, setBulkFormData] = useState({
    city: "",
    duration_type: "4h",
    price_currency: "EUR",
    hourly_rate: "",
    vito_price: "",
    vito_vip_price: "",
    maybach_price: "",
    sprinter_price: "",
  });

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      navigate("/");
      return;
    }
    if (role === "admin") {
      fetchPrices();
    }
  }, [role, roleLoading, navigate]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hourly_rental_prices")
        .select("*")
        .order("city", { ascending: true })
        .order("vehicle_type", { ascending: true })
        .order("duration_type", { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (error: any) {
      toast.error("Fiyatlar yüklenirken hata oluştu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.city || !formData.price) {
      toast.error("Şehir ve fiyat zorunludur");
      return;
    }

    try {
      const payload = {
        city: formData.city.trim(),
        vehicle_type: formData.vehicle_type,
        duration_type: formData.duration_type,
        price: parseFloat(formData.price) || 0,
        price_currency: formData.price_currency,
        hourly_rate: formData.duration_type === "custom" ? parseFloat(formData.hourly_rate) || null : null,
        is_active: formData.is_active,
      };

      if (editingPrice) {
        const { error } = await supabase
          .from("hourly_rental_prices")
          .update(payload)
          .eq("id", editingPrice.id);

        if (error) throw error;
        toast.success("Fiyat güncellendi");
      } else {
        const { error } = await supabase
          .from("hourly_rental_prices")
          .insert(payload);

        if (error) {
          if (error.code === "23505") {
            toast.error("Bu şehir, araç ve süre kombinasyonu zaten mevcut");
            return;
          }
          throw error;
        }
        toast.success("Fiyat eklendi");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPrices();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu fiyatı silmek istediğinize emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("hourly_rental_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Fiyat silindi");
      fetchPrices();
    } catch (error: any) {
      toast.error("Silme işlemi başarısız");
      console.error(error);
    }
  };

  const handleEdit = (price: HourlyRentalPrice) => {
    setEditingPrice(price);
    setFormData({
      city: price.city,
      vehicle_type: price.vehicle_type,
      duration_type: price.duration_type,
      price: price.price.toString(),
      price_currency: price.price_currency,
      hourly_rate: price.hourly_rate?.toString() || "",
      is_active: price.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPrice(null);
    setFormData({
      city: "",
      vehicle_type: "vito",
      duration_type: "4h",
      price: "",
      price_currency: "EUR",
      hourly_rate: "",
      is_active: true,
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      city: "",
      duration_type: "4h",
      price_currency: "EUR",
      hourly_rate: "",
      vito_price: "",
      vito_vip_price: "",
      maybach_price: "",
      sprinter_price: "",
    });
  };

  const handleBulkSubmit = async () => {
    if (!bulkFormData.city) {
      toast.error("Şehir zorunludur");
      return;
    }

    const vehiclePrices = [
      { type: "vito", price: bulkFormData.vito_price },
      { type: "vito_vip", price: bulkFormData.vito_vip_price },
      { type: "maybach", price: bulkFormData.maybach_price },
      { type: "sprinter", price: bulkFormData.sprinter_price },
    ].filter(v => v.price && parseFloat(v.price) > 0);

    if (vehiclePrices.length === 0) {
      toast.error("En az bir araç için fiyat girin");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      let errorMessages: string[] = [];

      for (const vp of vehiclePrices) {
        const payload = {
          city: bulkFormData.city.trim(),
          vehicle_type: vp.type,
          duration_type: bulkFormData.duration_type,
          price: parseFloat(vp.price) || 0,
          price_currency: bulkFormData.price_currency,
          hourly_rate: bulkFormData.duration_type === "custom" ? parseFloat(bulkFormData.hourly_rate) || null : null,
          is_active: true,
        };

        // Check if exists - use maybeSingle() instead of single() to avoid error when no rows
        const { data: existing, error: checkError } = await supabase
          .from("hourly_rental_prices")
          .select("id")
          .eq("city", payload.city)
          .eq("vehicle_type", payload.vehicle_type)
          .eq("duration_type", payload.duration_type)
          .maybeSingle();

        if (checkError) {
          console.error(`Check error for ${vp.type}:`, checkError);
          errorCount++;
          errorMessages.push(`${vp.type}: ${checkError.message}`);
          continue;
        }

        if (existing) {
          // Update
          const { error } = await supabase
            .from("hourly_rental_prices")
            .update(payload)
            .eq("id", existing.id);

          if (error) {
            console.error(`Update error for ${vp.type}:`, error);
            errorCount++;
            errorMessages.push(`${vp.type}: ${error.message}`);
          } else {
            successCount++;
          }
        } else {
          // Insert
          const { error } = await supabase
            .from("hourly_rental_prices")
            .insert(payload);

          if (error) {
            console.error(`Insert error for ${vp.type}:`, error);
            errorCount++;
            errorMessages.push(`${vp.type}: ${error.message}`);
          } else {
            successCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} araç fiyatı kaydedildi${errorCount > 0 ? `, ${errorCount} hata` : ''}`);
      } 
      
      if (errorCount > 0) {
        toast.error(`${errorCount} hata oluştu: ${errorMessages.join(', ')}`);
      }

      if (successCount > 0 || errorCount === 0) {
        setIsBulkDialogOpen(false);
        resetBulkForm();
      }
      fetchPrices();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
      console.error("Bulk submit error:", error);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("hourly_rental_prices")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentState ? "Fiyat deaktif edildi" : "Fiyat aktif edildi");
      fetchPrices();
    } catch (error: any) {
      toast.error("Durum güncellenemedi");
      console.error(error);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "EUR": return "€";
      case "USD": return "$";
      case "GBP": return "£";
      default: return currency;
    }
  };

  const getVehicleLabel = (value: string) => {
    return vehicleTypes.find(v => v.value === value)?.label || value;
  };

  const getDurationLabel = (value: string) => {
    return durationTypes.find(d => d.value === value)?.label || value;
  };

  // Filter prices
  const filteredPrices = prices.filter(p => {
    if (filterCity !== "all" && p.city !== filterCity) return false;
    if (filterVehicle !== "all" && p.vehicle_type !== filterVehicle) return false;
    return true;
  });

  // Get unique cities from prices
  const uniqueCities = [...new Set(prices.map(p => p.city))].sort();

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Saatlik Kiralama Fiyatları</h1>
              <p className="text-muted-foreground">Şehir ve araç bazlı saatlik kiralama fiyatlarını yönetin</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Bulk Update Dialog */}
            <Button variant="outline" className="gap-2" onClick={() => setIsBulkUpdateDialogOpen(true)}>
              <Percent className="h-4 w-4" />
              % Güncelle
            </Button>
            {/* Bulk Add Dialog */}
            <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
              setIsBulkDialogOpen(open);
              if (!open) resetBulkForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Car className="h-4 w-4" />
                  Toplu Fiyat Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Toplu Fiyat Ekle (4 Araç)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="bulkCity">Şehir</Label>
                    <Select
                      value={bulkFormData.city}
                      onValueChange={(value) => setBulkFormData({ ...bulkFormData, city: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Veya yeni şehir adı yazın"
                      value={bulkFormData.city}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, city: e.target.value })}
                    />
                  </div>

                  {/* Duration & Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Süre Tipi</Label>
                      <Select
                        value={bulkFormData.duration_type}
                        onValueChange={(value) => setBulkFormData({ ...bulkFormData, duration_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi</Label>
                      <Select
                        value={bulkFormData.price_currency}
                        onValueChange={(value) => setBulkFormData({ ...bulkFormData, price_currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Hourly Rate for custom */}
                  {bulkFormData.duration_type === "custom" && (
                    <div className="space-y-2">
                      <Label>Saatlik Ücret (Tüm Araçlar)</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={bulkFormData.hourly_rate}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, hourly_rate: e.target.value })}
                      />
                    </div>
                  )}

                  {/* All 4 vehicle prices */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-base font-semibold">Araç Fiyatları</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mercedes Vito</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bulkFormData.vito_price}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, vito_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mercedes Vito VIP</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bulkFormData.vito_vip_price}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, vito_vip_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mercedes Maybach</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bulkFormData.maybach_price}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, maybach_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mercedes Sprinter</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bulkFormData.sprinter_price}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, sprinter_price: e.target.value })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Boş bırakılan araçlar için fiyat eklenmez. Mevcut fiyatlar güncellenir.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">İptal</Button>
                  </DialogClose>
                  <Button onClick={handleBulkSubmit}>
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Single Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tekli Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPrice ? "Fiyat Düzenle" : "Yeni Fiyat Ekle"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city">Şehir</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şehir seçin veya yazın" />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Veya yeni şehir adı yazın"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div className="space-y-2">
                    <Label>Araç Tipi</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Type */}
                  <div className="space-y-2">
                    <Label>Süre Tipi</Label>
                    <Select
                      value={formData.duration_type}
                      onValueChange={(value) => setFormData({ ...formData, duration_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price & Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fiyat</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi</Label>
                      <Select
                        value={formData.price_currency}
                        onValueChange={(value) => setFormData({ ...formData, price_currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Hourly Rate (for custom) */}
                  {formData.duration_type === "custom" && (
                    <div className="space-y-2">
                      <Label>Saatlik Ücret</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Özel süre için saatlik ücret (örn: 30 €/saat)
                      </p>
                    </div>
                  )}

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <Label>Aktif</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">İptal</Button>
                  </DialogClose>
                  <Button onClick={handleSubmit}>
                    {editingPrice ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueCities.length}</p>
                  <p className="text-sm text-muted-foreground">Şehir</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Car className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{prices.length}</p>
                  <p className="text-sm text-muted-foreground">Fiyat Kaydı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{prices.filter(p => p.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Euro className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {prices.length > 0 ? Math.min(...prices.filter(p => p.price > 0).map(p => p.price)) : 0}€
                  </p>
                  <p className="text-sm text-muted-foreground">Min Fiyat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Label className="text-sm mb-2 block">Şehir</Label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şehirler</SelectItem>
                    {uniqueCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-sm mb-2 block">Araç Tipi</Label>
                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Araçlar</SelectItem>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fiyat Listesi</CardTitle>
            <CardDescription>
              {filteredPrices.length} kayıt gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Araç</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead className="text-right">Saatlik</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Henüz fiyat kaydı bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrices.map((price) => (
                      <TableRow key={price.id} className={!price.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{price.city}</TableCell>
                        <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                        <TableCell>{getDurationLabel(price.duration_type)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {price.price > 0 ? `${getCurrencySymbol(price.price_currency)}${price.price}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {price.hourly_rate ? `${getCurrencySymbol(price.price_currency)}${price.hourly_rate}/saat` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={price.is_active}
                            onCheckedChange={() => toggleActive(price.id, price.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(price)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(price.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Price Update Dialog */}
        <BulkPriceUpdateDialog
          open={isBulkUpdateDialogOpen}
          onOpenChange={setIsBulkUpdateDialogOpen}
          priceType="hourly"
          onSuccess={fetchPrices}
          cities={uniqueCities}
          vehicleTypes={vehicleTypes}
        />
      </div>
    </div>
  );
};

export default AdminHourlyRentalPrices;
