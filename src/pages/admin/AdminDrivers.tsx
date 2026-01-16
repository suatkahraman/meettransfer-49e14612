import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, UserX, UserCheck, Phone, MapPin, Loader2, Eye, Briefcase, Car, Trash2, Star, Mail, Palette, Search, X, Filter } from 'lucide-react';

// Shared constants - synchronized with DriverInfoEditor
const vehicleTypes = [
  { value: 'Sedan', label: 'Sedan' },
  { value: 'Mercedes Vito', label: 'Mercedes Vito' },
  { value: 'Mercedes VIP Vito', label: 'VIP Mercedes Vito' },
  { value: 'Mercedes Maybach Minivan', label: 'Mercedes Maybach Minivan' },
  { value: 'Minibus', label: 'Minibus' },
];

const regions = [
  { value: 'Istanbul', label: 'İstanbul' },
  { value: 'Antalya', label: 'Antalya' },
  { value: 'Bodrum', label: 'Bodrum' },
  { value: 'Dalaman', label: 'Dalaman' },
  { value: 'Izmir', label: 'İzmir' },
  { value: 'Cappadocia', label: 'Kapadokya' },
  { value: 'Bursa', label: 'Bursa' },
  { value: 'Dubai', label: 'Dubai' },
  { value: 'Cyprus', label: 'Kıbrıs' },
];

const vehicleColors = [
  { value: 'Siyah', label: 'Siyah' },
  { value: 'Beyaz', label: 'Beyaz' },
  { value: 'Gri', label: 'Gri' },
  { value: 'Gümüş', label: 'Gümüş' },
  { value: 'Lacivert', label: 'Lacivert' },
  { value: 'Mavi', label: 'Mavi' },
  { value: 'Kırmızı', label: 'Kırmızı' },
  { value: 'Bordo', label: 'Bordo' },
  { value: 'Kahverengi', label: 'Kahverengi' },
  { value: 'Bej', label: 'Bej' },
];

interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  plate_number: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  region: string | null;
  active: boolean;
  average_rating: number | null;
  total_reviews: number | null;
}

// Skeleton component for driver cards
const DriverCardSkeleton = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

const AdminDrivers = () => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingDriverEmail, setViewingDriverEmail] = useState<string | null>(null);
  const [loadingDriverEmail, setLoadingDriverEmail] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plate_number: '',
    vehicle_model: '',
    vehicle_color: '',
    region: '',
    email: '',
    password: '',
  });

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        driver.name.toLowerCase().includes(searchLower) ||
        driver.phone.includes(searchQuery) ||
        (driver.plate_number?.toLowerCase().includes(searchLower));
      
      // Region filter
      const matchesRegion = filterRegion === 'all' || driver.region === filterRegion;
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && driver.active) ||
        (filterStatus === 'inactive' && !driver.active);
      
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [drivers, searchQuery, filterRegion, filterStatus]);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error:', error);
      toast.error('Şoförler yüklenemedi');
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      plate_number: '',
      vehicle_model: '',
      vehicle_color: '',
      region: '',
      email: '',
      password: '',
    });
  };

  const openAddDialog = () => {
    setEditingDriver(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      plate_number: driver.plate_number || '',
      vehicle_model: driver.vehicle_model || '',
      vehicle_color: driver.vehicle_color || '',
      region: driver.region || '',
      email: '',
      password: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Ad soyad gereklidir');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Telefon numarası gereklidir');
      return;
    }
    if (!formData.region) {
      toast.error('Lütfen bir bölge seçin');
      return;
    }
    if (!editingDriver) {
      if (!formData.email.trim()) {
        toast.error('E-posta gereklidir');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error('Şifre en az 6 karakter olmalıdır');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (editingDriver) {
        const oldData = {
          name: editingDriver.name,
          phone: editingDriver.phone,
          plate_number: editingDriver.plate_number,
          vehicle_model: editingDriver.vehicle_model,
          vehicle_color: editingDriver.vehicle_color,
          region: editingDriver.region,
        };

        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            plate_number: formData.plate_number.trim() || null,
            vehicle_model: formData.vehicle_model || null,
            vehicle_color: formData.vehicle_color || null,
            region: formData.region || null,
          })
          .eq('id', editingDriver.id);

        if (error) throw error;

        await logAction({
          action: 'UPDATE',
          table_name: 'drivers',
          record_id: editingDriver.id,
          old_data: oldData,
          new_data: {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            plate_number: formData.plate_number.trim() || null,
            vehicle_model: formData.vehicle_model || null,
            vehicle_color: formData.vehicle_color || null,
            region: formData.region || null,
          },
        });

        toast.success('Şoför güncellendi');
        setDialogOpen(false);
        fetchDrivers();
      } else {
        const { data, error } = await supabase.functions.invoke('create-user-account', {
          body: {
            email: formData.email.trim(),
            password: formData.password,
            role: 'driver',
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            plate_number: formData.plate_number.trim(),
            vehicle_model: formData.vehicle_model,
            vehicle_color: formData.vehicle_color,
            region: formData.region,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        await logAction({
          action: 'CREATE',
          table_name: 'drivers',
          record_id: data?.driver_id,
          new_data: {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            plate_number: formData.plate_number.trim(),
            vehicle_model: formData.vehicle_model,
            vehicle_color: formData.vehicle_color,
            region: formData.region,
            email: formData.email.trim(),
          },
        });

        toast.success('Şoför başarıyla oluşturuldu!');
        setDialogOpen(false);
        fetchDrivers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Şoför kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (driver: Driver) => {
    const { error } = await supabase
      .from('drivers')
      .update({ active: !driver.active })
      .eq('id', driver.id);

    if (error) {
      toast.error('Şoför durumu güncellenemedi');
    } else {
      await logAction({
        action: driver.active ? 'DEACTIVATE' : 'ACTIVATE',
        table_name: 'drivers',
        record_id: driver.id,
        old_data: { active: driver.active, name: driver.name },
        new_data: { active: !driver.active, name: driver.name },
      });

      toast.success(driver.active ? 'Şoför pasif yapıldı' : 'Şoför aktif yapıldı');
      fetchDrivers();
    }
  };

  const openDeleteDialog = (driver: Driver) => {
    setDeletingDriver(driver);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDriver) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', deletingDriver.id);

      if (error) throw error;

      await logAction({
        action: 'DELETE',
        table_name: 'drivers',
        record_id: deletingDriver.id,
        old_data: {
          name: deletingDriver.name,
          phone: deletingDriver.phone,
          plate_number: deletingDriver.plate_number,
          vehicle_model: deletingDriver.vehicle_model,
          region: deletingDriver.region,
        },
      });

      toast.success('Şoför başarıyla silindi');
      setDeleteDialogOpen(false);
      setDeletingDriver(null);
      fetchDrivers();
    } catch (err) {
      toast.error('Şoför silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  const openViewDialog = async (driver: Driver) => {
    setViewingDriver(driver);
    setViewDialogOpen(true);
    setViewingDriverEmail(null);
    setLoadingDriverEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-driver-email', {
        body: { driver_id: driver.id }
      });
      if (!error && data?.email) {
        setViewingDriverEmail(data.email);
      }
    } catch (e) {
      console.error('Exception fetching driver email:', e);
    } finally {
      setLoadingDriverEmail(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRegion('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchQuery || filterRegion !== 'all' || filterStatus !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 md:px-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-serif">Şoförler</h1>
              <p className="text-sm text-primary-foreground/70">
                {loading ? '...' : `${filteredDrivers.length} / ${drivers.length} şoför`}
              </p>
            </div>
          </div>
          <Button onClick={openAddDialog} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Şoför Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, telefon veya plaka ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-primary-foreground text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-32 bg-primary-foreground text-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Bölge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölgeler</SelectItem>
                {regions.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28 bg-primary-foreground text-foreground">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="text-primary-foreground hover:bg-primary-foreground/10">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <DriverCardSkeleton key={i} />)}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? 'Filtrelere uygun şoför bulunamadı' : 'Henüz şoför yok'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className={`transition-opacity ${!driver.active ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{driver.name}</h3>
                      <Badge variant={driver.active ? 'default' : 'secondary'}>
                        {driver.active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openViewDialog(driver)}
                        title="Detayları Gör"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openEditDialog(driver)}
                        title="Şoförü Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => toggleActive(driver)}
                        className={driver.active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                        title={driver.active ? 'Şoförü Pasif Yap' : 'Şoförü Aktif Yap'}
                      >
                        {driver.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate(`/admin/drivers/${driver.id}/jobs`)}
                        title="Atanan İşleri Gör"
                      >
                        <Briefcase className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openDeleteDialog(driver)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Şoförü Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{driver.phone}</span>
                    </div>
                    {(driver.vehicle_model || driver.plate_number || driver.vehicle_color) && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {[driver.vehicle_model, driver.plate_number, driver.vehicle_color && `(${driver.vehicle_color})`]
                            .filter(Boolean)
                            .join(' - ')}
                        </span>
                      </div>
                    )}
                    {driver.region && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{regions.find(r => r.value === driver.region)?.label || driver.region}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Star className={`h-4 w-4 flex-shrink-0 ${(driver.total_reviews || 0) > 0 ? 'fill-accent text-accent' : 'text-muted-foreground/50'}`} />
                      {(driver.total_reviews || 0) > 0 ? (
                        <span className="font-medium">
                          {(driver.average_rating || 0).toFixed(1)} 
                          <span className="text-muted-foreground font-normal ml-1">
                            ({driver.total_reviews} değerlendirme)
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Henüz değerlendirme yok</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Şoförü Düzenle' : 'Yeni Şoför Ekle'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Soyad *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Bölge *</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({...formData, region: v})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Bölge seçin" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {regions.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Info */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Araç Bilgileri
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Araç Modeli</Label>
                  <Select value={formData.vehicle_model} onValueChange={(v) => setFormData({...formData, vehicle_model: v})}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Model seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {vehicleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Araç Rengi</Label>
                  <Select value={formData.vehicle_color} onValueChange={(v) => setFormData({...formData, vehicle_color: v})}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Renk seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {vehicleColors.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Plaka</Label>
                <Input
                  value={formData.plate_number}
                  onChange={(e) => setFormData({...formData, plate_number: e.target.value.toUpperCase()})}
                  placeholder="34 ABC 123"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Login Credentials (only for new drivers) */}
            {!editingDriver && (
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Giriş Bilgileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-posta *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="sofor@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şifre *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Min. 6 karakter"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingDriver ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                </>
              ) : (
                editingDriver ? 'Güncelle' : 'Şoför Oluştur'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Driver Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) { setViewingDriverEmail(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şoför Detayları</DialogTitle>
          </DialogHeader>
          {viewingDriver && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {viewingDriver.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{viewingDriver.name}</h3>
                  <Badge variant={viewingDriver.active ? 'default' : 'secondary'}>
                    {viewingDriver.active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefon
                  </span>
                  <span className="font-medium">{viewingDriver.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Bölge
                  </span>
                  <span className="font-medium">
                    {regions.find(r => r.value === viewingDriver.region)?.label || viewingDriver.region || 'Atanmadı'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Car className="h-4 w-4" /> Araç Modeli
                  </span>
                  <span className="font-medium">{viewingDriver.vehicle_model || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Car className="h-4 w-4" /> Plaka
                  </span>
                  <span className="font-medium font-mono">{viewingDriver.plate_number || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Araç Rengi
                  </span>
                  <span className="font-medium">{viewingDriver.vehicle_color || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-posta
                  </span>
                  {loadingDriverEmail ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yükleniyor...
                    </span>
                  ) : viewingDriverEmail ? (
                    <span className="font-medium text-green-600">{viewingDriverEmail}</span>
                  ) : (
                    <span className="font-medium text-destructive">E-posta bulunamadı</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4" /> Değerlendirme
                  </span>
                  {(viewingDriver.total_reviews || 0) > 0 ? (
                    <span className="font-medium">
                      {(viewingDriver.average_rating || 0).toFixed(1)} ({viewingDriver.total_reviews} yorum)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Henüz yok</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setViewDialogOpen(false);
                if (viewingDriver) openEditDialog(viewingDriver);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şoförü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingDriver?.name}</strong> şoförünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDrivers;
