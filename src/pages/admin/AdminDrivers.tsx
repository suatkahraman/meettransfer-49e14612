import { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, UserX, UserCheck, Phone, MapPin, Loader2, Eye, Briefcase, Car, Trash2, Star, Mail, Palette } from 'lucide-react';

const regions = [
  { value: 'Istanbul', label: 'İstanbul' },
  { value: 'Antalya', label: 'Antalya' },
  { value: 'Bodrum', label: 'Bodrum' },
  { value: 'Dalaman', label: 'Dalaman' },
  { value: 'Izmir', label: 'İzmir' },
  { value: 'Cappadocia', label: 'Kapadokya' },
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

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error:', error);
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openAddDialog = () => {
    setEditingDriver(null);
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
    setIsSubmitting(true);
    
    try {
      if (editingDriver) {
        // Store old data for audit log
        const oldData = {
          name: editingDriver.name,
          phone: editingDriver.phone,
          plate_number: editingDriver.plate_number,
          vehicle_model: editingDriver.vehicle_model,
          vehicle_color: editingDriver.vehicle_color,
          region: editingDriver.region,
        };

        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name,
            phone: formData.phone,
            plate_number: formData.plate_number || null,
            vehicle_model: formData.vehicle_model || null,
            vehicle_color: formData.vehicle_color || null,
            region: formData.region || null,
          })
          .eq('id', editingDriver.id);

        if (error) {
          toast.error('Şoför güncellenemedi');
        } else {
          // Audit log for driver update
          await logAction({
            action: 'UPDATE',
            table_name: 'drivers',
            record_id: editingDriver.id,
            old_data: oldData,
            new_data: {
              name: formData.name,
              phone: formData.phone,
              plate_number: formData.plate_number || null,
              vehicle_model: formData.vehicle_model || null,
              vehicle_color: formData.vehicle_color || null,
              region: formData.region || null,
            },
          });

          toast.success('Şoför güncellendi');
          setDialogOpen(false);
          fetchDrivers();
        }
      } else {
        // Create new driver via edge function
        if (!formData.email || !formData.password) {
          toast.error('Yeni şoförler için e-posta ve şifre gereklidir');
          return;
        }

        if (!formData.name || !formData.phone) {
          toast.error('Ad ve telefon gereklidir');
          return;
        }

        if (!formData.region) {
          toast.error('Lütfen bir bölge seçin');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-user-account', {
          body: {
            email: formData.email,
            password: formData.password,
            role: 'driver',
            name: formData.name,
            phone: formData.phone,
            plate_number: formData.plate_number,
            vehicle_model: formData.vehicle_model,
            vehicle_color: formData.vehicle_color,
            region: formData.region,
          },
        });

        if (error) {
          toast.error(error.message || 'Şoför oluşturulamadı');
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          return;
        }

        // Audit log for driver creation
        await logAction({
          action: 'CREATE',
          table_name: 'drivers',
          record_id: data?.driver_id,
          new_data: {
            name: formData.name,
            phone: formData.phone,
            plate_number: formData.plate_number,
            vehicle_model: formData.vehicle_model,
            vehicle_color: formData.vehicle_color,
            region: formData.region,
            email: formData.email,
          },
        });

        toast.success('Şoför başarıyla oluşturuldu!');
        setDialogOpen(false);
        fetchDrivers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Şoför oluşturulamadı');
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
      // Audit log for status toggle
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

      if (error) {
        toast.error('Şoför silinemedi');
      } else {
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
      }
    } catch (err) {
      toast.error('Şoför silinemedi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Şoförler</h1>
        </div>
        <Button onClick={openAddDialog} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          <Plus className="h-4 w-4 mr-2" />
          Şoför Ekle
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Henüz şoför yok</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <Card key={driver.id} className={!driver.active ? 'opacity-60' : ''}>
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
                        onClick={async () => {
                          setViewingDriver(driver);
                          setViewDialogOpen(true);
                          setViewingDriverEmail(null);
                          setLoadingDriverEmail(true);
                          try {
                            const { data, error } = await supabase.functions.invoke('get-driver-email', {
                              body: { driver_id: driver.id }
                            });
                            if (error) {
                              console.error('Failed to fetch driver email:', error);
                            } else if (data?.email) {
                              setViewingDriverEmail(data.email);
                            }
                          } catch (e) {
                            console.error('Exception fetching driver email:', e);
                          } finally {
                            setLoadingDriverEmail(false);
                          }
                        }}
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
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.phone}</span>
                    </div>
                    {driver.plate_number && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {driver.plate_number}
                          {driver.vehicle_model ? ` - ${driver.vehicle_model}` : ''}
                          {driver.vehicle_color ? ` (${driver.vehicle_color})` : ''}
                        </span>
                      </div>
                    )}
                    {!driver.plate_number && driver.vehicle_model && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {driver.vehicle_model}
                          {driver.vehicle_color ? ` (${driver.vehicle_color})` : ''}
                        </span>
                      </div>
                    )}
                    {!driver.plate_number && !driver.vehicle_model && driver.vehicle_color && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <span>{driver.vehicle_color}</span>
                      </div>
                    )}
                    {driver.region && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{driver.region}</span>
                      </div>
                    )}
                    {/* Driver Rating */}
                    <div className="flex items-center gap-2 pt-1">
                      <Star className={`h-4 w-4 ${(driver.total_reviews || 0) > 0 ? 'fill-accent text-accent' : 'text-muted-foreground/50'}`} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Şoförü Düzenle' : 'Yeni Şoför Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Plaka</Label>
              <Input
                value={formData.plate_number}
                onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                placeholder="örn. 34 ABC 123"
              />
            </div>
            <div className="space-y-2">
              <Label>Araç Modeli</Label>
              <Input
                value={formData.vehicle_model}
                onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                placeholder="örn. Mercedes Vito"
              />
            </div>
            <div className="space-y-2">
              <Label>Araç Rengi</Label>
              <Input
                value={formData.vehicle_color}
                onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                placeholder="örn. Siyah"
              />
            </div>
            <div className="space-y-2">
              <Label>Bölge</Label>
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
            {!editingDriver && (
              <>
                <div className="space-y-2">
                  <Label>E-posta (giriş için)</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="sofor@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şifre</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 6 karakter"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
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
                    <Car className="h-4 w-4" /> Plaka
                  </span>
                  <span className="font-medium">{viewingDriver.plate_number || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Car className="h-4 w-4" /> Araç Modeli
                  </span>
                  <span className="font-medium">{viewingDriver.vehicle_model || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Araç Rengi
                  </span>
                  <span className="font-medium">{viewingDriver.vehicle_color || 'Belirtilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Bölge
                  </span>
                  <span className="font-medium">{viewingDriver.region || 'Atanmadı'}</span>
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
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setViewDialogOpen(false);
                if (viewingDriver) openEditDialog(viewingDriver);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Şoförü Düzenle
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
              <strong>{deletingDriver?.name}</strong> şoförünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm şoför bilgileri silinecektir.
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
