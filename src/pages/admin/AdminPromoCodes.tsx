import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Percent, Calendar, RefreshCw, BarChart3, TrendingUp, Users, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  applies_to: string;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_count: number;
  max_usage: number | null;
  created_at: string;
  updated_at: string;
}

interface PromoCodeStats {
  code: string;
  quick_booking_usage: number;
  reservation_usage: number;
  total_usage: number;
}

interface PromoCodeFormData {
  code: string;
  discount_percentage: number;
  description: string;
  applies_to: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  max_usage: string;
}

interface PromoUsageItem {
  id: string;
  type: 'quick_booking' | 'reservation';
  customer_name: string | null;
  customer_phone: string | null;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  created_at: string;
  status: string;
}

const initialFormData: PromoCodeFormData = {
  code: "",
  discount_percentage: 30,
  description: "",
  applies_to: "return_transfer",
  is_active: true,
  valid_from: "",
  valid_until: "",
  max_usage: "",
};

const AdminPromoCodes = () => {
  const navigate = useNavigate();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoStats, setPromoStats] = useState<PromoCodeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [usageDialogCode, setUsageDialogCode] = useState<string | null>(null);
  const [usageDialogType, setUsageDialogType] = useState<'all' | 'quick_booking' | 'reservation'>('all');
  const [usageItems, setUsageItems] = useState<PromoUsageItem[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleData?.role !== "admin") {
        navigate("/admin");
        return;
      }

      setIsAdmin(true);
      setAuthChecked(true);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (authChecked && isAdmin) {
      fetchPromoCodes();
      fetchPromoStats();
    }
  }, [authChecked, isAdmin]);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error: any) {
      toast.error("Promo kodları yüklenirken hata oluştu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoStats = async () => {
    try {
      // Fetch usage from quick_booking_requests
      const { data: qbData, error: qbError } = await supabase
        .from("quick_booking_requests")
        .select("promo_code")
        .not("promo_code", "is", null);

      // Fetch usage from reservations
      const { data: resData, error: resError } = await supabase
        .from("reservations")
        .select("promo_code")
        .not("promo_code", "is", null);

      if (qbError || resError) {
        console.error("Error fetching stats:", qbError || resError);
        return;
      }

      // Count usage per promo code
      const statsMap = new Map<string, { qb: number; res: number }>();
      
      qbData?.forEach(item => {
        if (item.promo_code) {
          const existing = statsMap.get(item.promo_code) || { qb: 0, res: 0 };
          existing.qb++;
          statsMap.set(item.promo_code, existing);
        }
      });

      resData?.forEach(item => {
        if (item.promo_code) {
          const existing = statsMap.get(item.promo_code) || { qb: 0, res: 0 };
          existing.res++;
          statsMap.set(item.promo_code, existing);
        }
      });

      const stats: PromoCodeStats[] = Array.from(statsMap.entries()).map(([code, counts]) => ({
        code,
        quick_booking_usage: counts.qb,
        reservation_usage: counts.res,
        total_usage: counts.qb + counts.res,
      }));

      setPromoStats(stats);
    } catch (error) {
      console.error("Error fetching promo stats:", error);
    }
  };

  const getStatsForCode = (code: string): PromoCodeStats | undefined => {
    return promoStats.find(s => s.code === code);
  };

  const openUsageDialog = async (code: string | null, type: 'all' | 'quick_booking' | 'reservation') => {
    setUsageDialogCode(code);
    setUsageDialogType(type);
    setUsageDialogOpen(true);
    setUsageLoading(true);
    setUsageItems([]);

    try {
      const items: PromoUsageItem[] = [];

      // Fetch from quick_booking_requests
      if (type === 'all' || type === 'quick_booking') {
        let qbQuery = supabase
          .from("quick_booking_requests")
          .select("id, customer_name, customer_phone, pickup, dropoff, pickup_date, created_at, status, promo_code")
          .not("promo_code", "is", null)
          .order("created_at", { ascending: false });

        if (code) {
          qbQuery = qbQuery.eq("promo_code", code);
        }

        const { data: qbData, error: qbError } = await qbQuery;
        if (qbError) throw qbError;

        qbData?.forEach(item => {
          items.push({
            id: item.id,
            type: 'quick_booking',
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
            pickup: item.pickup,
            dropoff: item.dropoff,
            pickup_date: item.pickup_date,
            created_at: item.created_at || '',
            status: item.status,
          });
        });
      }

      // Fetch from reservations
      if (type === 'all' || type === 'reservation') {
        let resQuery = supabase
          .from("reservations")
          .select("id, customer_name, customer_phone, pickup, dropoff, pickup_date, created_at, status, promo_code")
          .not("promo_code", "is", null)
          .order("created_at", { ascending: false });

        if (code) {
          resQuery = resQuery.eq("promo_code", code);
        }

        const { data: resData, error: resError } = await resQuery;
        if (resError) throw resError;

        resData?.forEach(item => {
          items.push({
            id: item.id,
            type: 'reservation',
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
            pickup: item.pickup,
            dropoff: item.dropoff,
            pickup_date: item.pickup_date,
            created_at: item.created_at || '',
            status: item.status,
          });
        });
      }

      // Sort by created_at descending
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsageItems(items);
    } catch (error) {
      console.error("Error fetching usage items:", error);
      toast.error("Kullanım verileri yüklenirken hata oluştu");
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error("Promo kodu gerekli");
      return;
    }

    if (formData.discount_percentage < 1 || formData.discount_percentage > 100) {
      toast.error("İndirim oranı 1-100 arasında olmalı");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discount_percentage: formData.discount_percentage,
        description: formData.description || null,
        applies_to: formData.applies_to,
        is_active: formData.is_active,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        max_usage: formData.max_usage ? parseInt(formData.max_usage) : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("promo_codes")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Promo kod güncellendi");
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert([payload]);

        if (error) throw error;
        toast.success("Promo kod oluşturuldu");
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Hata oluştu");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setFormData({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      description: promo.description || "",
      applies_to: promo.applies_to,
      is_active: promo.is_active,
      valid_from: promo.valid_from ? promo.valid_from.split("T")[0] : "",
      valid_until: promo.valid_until ? promo.valid_until.split("T")[0] : "",
      max_usage: promo.max_usage?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu promo kodu silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Promo kod silindi");
      fetchPromoCodes();
    } catch (error: any) {
      toast.error("Silme işlemi başarısız");
      console.error(error);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentValue })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentValue ? "Promo kod devre dışı bırakıldı" : "Promo kod aktif edildi");
      fetchPromoCodes();
    } catch (error: any) {
      toast.error("Güncelleme başarısız");
      console.error(error);
    }
  };

  const getAppliesLabel = (type: string) => {
    switch (type) {
      case "return_transfer":
        return "Dönüş Transferi";
      case "one_way":
        return "Tek Yön";
      case "all":
        return "Tümü";
      default:
        return type;
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" />
                Promo Kod Yönetimi
              </h1>
              <p className="text-muted-foreground text-sm">
                İndirim kodlarını ekle, düzenle ve yönet
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData(initialFormData);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Promo Kod
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Promo Kod Düzenle" : "Yeni Promo Kod"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Promo Kodu *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="MEET30RETURN"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label>İndirim Oranı (%) *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Gidiş-dönüş transferlerde %30 indirim"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Uygulanacak Alan</Label>
                  <Select
                    value={formData.applies_to}
                    onValueChange={(value) => setFormData({ ...formData, applies_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="return_transfer">Dönüş Transferi</SelectItem>
                      <SelectItem value="one_way">Tek Yön</SelectItem>
                      <SelectItem value="all">Tümü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Geçerlilik Başlangıcı</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Geçerlilik Bitişi</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Maksimum Kullanım</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_usage}
                    onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                    placeholder="Sınırsız"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Aktif</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Toplam Promo Kod
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promoCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Aktif Kodlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {promoCodes.filter((p) => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openUsageDialog(null, 'quick_booking')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Quick Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {promoStats.reduce((acc, s) => acc + s.quick_booking_usage, 0)}
              </div>
              <p className="text-xs text-muted-foreground">kullanım - tıkla görüntüle</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openUsageDialog(null, 'reservation')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Rezervasyon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {promoStats.reduce((acc, s) => acc + s.reservation_usage, 0)}
              </div>
              <p className="text-xs text-muted-foreground">kullanım - tıkla görüntüle</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Uygulama Alanı</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Henüz promo kod yok
                    </TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <span className="font-mono font-bold">{promo.code}</span>
                        </div>
                        {promo.description && (
                          <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">%{promo.discount_percentage}</span>
                      </TableCell>
                      <TableCell>{getAppliesLabel(promo.applies_to)}</TableCell>
                      <TableCell>
                        {(() => {
                          const stats = getStatsForCode(promo.code);
                          if (stats && stats.total_usage > 0) {
                            return (
                              <div 
                                className="space-y-1 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                                onClick={() => openUsageDialog(promo.code, 'all')}
                              >
                                <div className="text-sm font-bold text-primary flex items-center gap-1">
                                  {stats.total_usage} toplam
                                  <ExternalLink className="h-3 w-3" />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <span 
                                    className="text-blue-600 hover:underline cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); openUsageDialog(promo.code, 'quick_booking'); }}
                                  >
                                    {stats.quick_booking_usage} QB
                                  </span>
                                  {" • "}
                                  <span 
                                    className="text-green-600 hover:underline cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); openUsageDialog(promo.code, 'reservation'); }}
                                  >
                                    {stats.reservation_usage} Rez
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <span className="text-muted-foreground">0</span>
                          );
                        })()}
                        {promo.max_usage && (
                          <div className="text-xs text-muted-foreground mt-1">
                            max: {promo.max_usage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => toggleActive(promo.id, promo.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        {promo.valid_from || promo.valid_until ? (
                          <div className="text-xs">
                            {promo.valid_from && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(promo.valid_from), "dd.MM.yyyy")}
                              </div>
                            )}
                            {promo.valid_until && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                → {format(new Date(promo.valid_until), "dd.MM.yyyy")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Süresiz</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(promo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(promo.id)}
                            className="text-destructive hover:text-destructive"
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
          </CardContent>
        </Card>

        {/* Usage Dialog */}
        <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {usageDialogCode ? (
                  <>Promo Kodu Kullananlar: <span className="font-mono">{usageDialogCode}</span></>
                ) : (
                  <>Tüm {usageDialogType === 'quick_booking' ? 'Quick Booking' : 'Rezervasyon'} Kullanımları</>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {usageLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : usageItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Henüz kullanım yok
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tip</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Güzergah</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <Badge variant={item.type === 'quick_booking' ? 'secondary' : 'default'}>
                            {item.type === 'quick_booking' ? 'QB' : 'Rez'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.customer_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.customer_phone || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px] truncate" title={item.pickup}>
                            {item.pickup}
                          </div>
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={item.dropoff}>
                            → {item.dropoff}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{format(new Date(item.pickup_date), "dd.MM.yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd.MM.yyyy HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.status === 'confirmed' || item.status === 'completed' ? 'default' :
                            item.status === 'pending' || item.status === 'priced' ? 'secondary' :
                            item.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (item.type === 'quick_booking') {
                                navigate(`/admin/quick-bookings`);
                              } else {
                                navigate(`/admin/reservations/${item.id}/edit`);
                              }
                              setUsageDialogOpen(false);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPromoCodes;
