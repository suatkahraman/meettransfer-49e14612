import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, FileText } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const airports = ['IST', 'SAW', 'AYT', 'BJV', 'DLM', 'ASR', 'NAV', 'ADB'];
const vehicleTypes = ['mercedes-vito', 'mercedes-vclass', 'maybach', 'minibus'];
const paymentTypes = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kart' },
  { value: 'online', label: 'Online' },
  { value: 'none', label: 'Yok' },
];
const currencies = [
  { value: 'TRY', label: '₺ TRY', symbol: '₺' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
];

interface Template {
  id: string;
  name: string;
  pickup: string;
  dropoff: string;
  vehicle_type: string;
  payment_type: string;
  price: number | null;
  price_currency: string | null;
  created_at: string;
}

const emptyForm = {
  name: '',
  pickup: '',
  dropoff: '',
  vehicle_type: 'mercedes-vito',
  payment_type: 'cash',
  price: '',
  price_currency: 'TRY',
};

const AdminTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const getCurrencySymbol = (currency: string | null) => {
    return currencies.find(c => c.value === currency)?.symbol || currency || '';
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('reservation_templates')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      pickup: template.pickup,
      dropoff: template.dropoff,
      vehicle_type: template.vehicle_type,
      payment_type: template.payment_type,
      price: template.price?.toString() || '',
      price_currency: template.price_currency || 'TRY',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.pickup || !formData.dropoff) {
      toast.error('Ad, alış ve bırakış noktası gereklidir');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        vehicle_type: formData.vehicle_type,
        payment_type: formData.payment_type,
        price: formData.price ? parseFloat(formData.price) : null,
        price_currency: formData.price_currency,
      };

      if (editingId) {
        const { error } = await supabase
          .from('reservation_templates')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Şablon güncellendi');
      } else {
        const { error } = await supabase
          .from('reservation_templates')
          .insert(payload);
        if (error) throw error;
        toast.success('Şablon oluşturuldu');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Şablon kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" şablonunu silmek istiyor musunuz?`)) return;

    const { error } = await supabase
      .from('reservation_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Şablon silinemedi');
    } else {
      toast.success('Şablon silindi');
      fetchTemplates();
    }
  };

  const currencySymbol = getCurrencySymbol(formData.price_currency);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Rota Şablonları</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Hızlı rezervasyon oluşturma için hazır fiyatlı rotaları kaydedin.
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Şablon
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : templates.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Henüz şablon yok</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Şablonu Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(template.id, template.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{template.pickup} → {template.dropoff}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{template.vehicle_type.replace('-', ' ')}</span>
                    <span>•</span>
                    <span>{template.payment_type === 'cash' ? 'Nakit' : template.payment_type === 'online' ? 'Online' : template.payment_type}</span>
                  </div>
                  {template.price && (
                    <div className="text-lg font-bold text-primary">
                      {getCurrencySymbol(template.price_currency)}{template.price}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Şablonu Düzenle' : 'Yeni Şablon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Şablon Adı *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="örn. IST - Taksim Standart"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alış Noktası *</Label>
                <Select value={formData.pickup} onValueChange={(v) => setFormData({...formData, pickup: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Havalimanı" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bırakış Noktası *</Label>
                <Input
                  value={formData.dropoff}
                  onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                  placeholder="Varış noktası"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Araç</Label>
                <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map(v => (
                      <SelectItem key={v} value={v}>{v.replace('-', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ödeme</Label>
                <Select value={formData.payment_type} onValueChange={(v) => setFormData({...formData, payment_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={formData.price_currency} onValueChange={(v) => setFormData({...formData, price_currency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fiyat</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTemplates;
