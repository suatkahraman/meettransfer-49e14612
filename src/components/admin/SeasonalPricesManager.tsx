import { useState, useEffect } from "react";
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
import { Search, Calendar, Trash2, Pencil, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { MoneyInput } from "@/components/ui/money-input";
import { VEHICLE_TYPE_OPTIONS as VEHICLE_TYPES } from "@/lib/vehicleTypes";

type PriceType = "region" | "intercity" | "hourly";

interface SeasonalPrice {
  id: string;
  price: number;
  price_currency: string;
  vehicle_type: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  // Region specific
  city?: string;
  airport?: string | null;
  district?: string;
  // Intercity specific
  from_city?: string;
  from_district?: string | null;
  to_city?: string;
  to_district?: string | null;
  // Hourly specific
  duration_type?: string;
}

interface SeasonalPricesManagerProps {
  priceType: PriceType;
}

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'TRY', label: '₺ TRY' },
  { value: 'GBP', label: '£ GBP' },
];

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

const SeasonalPricesManager = ({ priceType }: SeasonalPricesManagerProps) => {
  const [prices, setPrices] = useState<SeasonalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<SeasonalPrice | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("EUR");
  const [saving, setSaving] = useState(false);

  const getTableName = () => {
    switch (priceType) {
      case "region": return "region_prices";
      case "intercity": return "intercity_prices";
      case "hourly": return "hourly_rental_prices";
    }
  };

  const getTitle = () => {
    switch (priceType) {
      case "region": return "Havalimanı Transferleri";
      case "intercity": return "Şehirler Arası";
      case "hourly": return "Saatlik Kiralama";
    }
  };

  const fetchSeasonalPrices = async () => {
    setLoading(true);
    try {
      const tableName = getTableName();
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .not("valid_from", "is", null)
        .not("valid_to", "is", null)
        .order("valid_from", { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error("Error fetching seasonal prices:", error);
      toast.error("Sezonluk fiyatlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonalPrices();
  }, [priceType]);

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺',
      'GBP': '£',
    };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  const formatDateRange = (validFrom: string, validTo: string) => {
    try {
      const from = parseISO(validFrom);
      const to = parseISO(validTo);
      return `${format(from, "d MMM", { locale: tr })} - ${format(to, "d MMM yyyy", { locale: tr })}`;
    } catch {
      return `${validFrom} - ${validTo}`;
    }
  };

  const getMonthFromDate = (dateStr: string): number => {
    try {
      return parseISO(dateStr).getMonth() + 1;
    } catch {
      return 0;
    }
  };

  const getYearFromDate = (dateStr: string): number => {
    try {
      return parseISO(dateStr).getFullYear();
    } catch {
      return 0;
    }
  };

  const getVehicleLabel = (vehicleType: string) => {
    const vehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    return vehicle?.label || vehicleType;
  };

  const getRouteDescription = (price: SeasonalPrice) => {
    if (priceType === "region") {
      return `${price.city} - ${price.district}${price.airport ? ` (${price.airport})` : ''}`;
    } else if (priceType === "intercity") {
      const from = price.from_district ? `${price.from_city} (${price.from_district})` : price.from_city;
      const to = price.to_district ? `${price.to_city} (${price.to_district})` : price.to_city;
      return `${from} → ${to}`;
    } else {
      return `${price.city} - ${price.duration_type}`;
    }
  };

  // Get unique years from prices
  const availableYears = [...new Set(prices.map(p => getYearFromDate(p.valid_from)))].filter(y => y > 0).sort((a, b) => b - a);

  const filteredPrices = prices.filter(price => {
    const route = getRouteDescription(price).toLowerCase();
    const matchesSearch = route.includes(searchTerm.toLowerCase()) ||
      getVehicleLabel(price.vehicle_type).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = filterMonth === "all" || 
      getMonthFromDate(price.valid_from) === parseInt(filterMonth);
    
    const matchesYear = filterYear === "all" || 
      getYearFromDate(price.valid_from) === parseInt(filterYear);
    
    return matchesSearch && matchesMonth && matchesYear;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bu sezonluk fiyatı silmek istediğinizden emin misiniz?")) return;

    try {
      const tableName = getTableName();
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Sezonluk fiyat silindi");
      fetchSeasonalPrices();
    } catch (error) {
      console.error("Error deleting seasonal price:", error);
      toast.error("Fiyat silinirken hata oluştu");
    }
  };

  const handleBulkDelete = async () => {
    if (filteredPrices.length === 0) {
      toast.error("Silinecek fiyat yok");
      return;
    }
    
    if (!confirm(`${filteredPrices.length} sezonluk fiyatı silmek istediğinizden emin misiniz?`)) return;

    try {
      const tableName = getTableName();
      const ids = filteredPrices.map(p => p.id);
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in("id", ids);

      if (error) throw error;
      toast.success(`${filteredPrices.length} sezonluk fiyat silindi`);
      fetchSeasonalPrices();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Fiyatlar silinirken hata oluştu");
    }
  };

  const openEditDialog = (price: SeasonalPrice) => {
    setEditingPrice(price);
    setEditPrice(price.price.toString());
    setEditCurrency(price.price_currency);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPrice || !editPrice) {
      toast.error("Lütfen fiyat girin");
      return;
    }

    setSaving(true);
    try {
      const tableName = getTableName();
      const { error } = await supabase
        .from(tableName)
        .update({
          price: parseFloat(editPrice),
          price_currency: editCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPrice.id);

      if (error) throw error;
      toast.success("Fiyat güncellendi");
      setEditDialogOpen(false);
      fetchSeasonalPrices();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Fiyat güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sezonluk Fiyatlar - {getTitle()}
        </CardTitle>
        <CardDescription>
          Belirli tarih aralıkları için tanımlanmış sezonluk/aylık fiyatları görüntüleyin ve yönetin
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Güzergah veya araç ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Yıl filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filteredPrices.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Tümünü Sil ({filteredPrices.length})
            </Button>
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
              ? "Henüz sezonluk fiyat tanımlanmamış. Aylık fiyat oluşturma özelliğini kullanarak sezonluk fiyatlar ekleyebilirsiniz."
              : "Filtrelere uygun sezonluk fiyat bulunamadı."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Güzergah</TableHead>
                  <TableHead>Araç</TableHead>
                  <TableHead>Tarih Aralığı</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {getRouteDescription(price)}
                    </TableCell>
                    <TableCell>{getVehicleLabel(price.vehicle_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {formatDateRange(price.valid_from, price.valid_to)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-accent">
                      {formatPrice(price.price, price.price_currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={price.is_active ? "default" : "secondary"}>
                        {price.is_active ? "Aktif" : "Pasif"}
                      </Badge>
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
          Toplam {filteredPrices.length} sezonluk fiyat kaydı
          {filterMonth !== "all" && ` (${MONTHS.find(m => m.value.toString() === filterMonth)?.label})`}
          {filterYear !== "all" && ` (${filterYear})`}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Sezonluk Fiyat Düzenle</DialogTitle>
            </DialogHeader>
            {editingPrice && (
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{getRouteDescription(editingPrice)}</p>
                  <p>{getVehicleLabel(editingPrice.vehicle_type)}</p>
                  <p>{formatDateRange(editingPrice.valid_from, editingPrice.valid_to)}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Fiyat</Label>
                  <MoneyInput
                    value={editPrice}
                    onValueChange={setEditPrice}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Select value={editCurrency} onValueChange={setEditCurrency}>
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
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SeasonalPricesManager;
