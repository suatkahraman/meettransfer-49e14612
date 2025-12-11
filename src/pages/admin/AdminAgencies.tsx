import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Building2, Edit, Trash2, DollarSign, Wallet } from 'lucide-react';

interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
  balance: number | null;
  created_at: string;
  updated_at: string;
}

const AdminAgencies = () => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    agency_name: '',
    comments: '',
  });

  const fetchAgencies = async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('agency_name');
    
    if (error) {
      toast.error('Acenteler yüklenemedi');
      return;
    }
    setAgencies(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgencies();

    // Real-time subscription
    const channel = supabase
      .channel('agencies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agencies' }, () => {
        fetchAgencies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCreateDialog = () => {
    setSelectedAgency(null);
    setFormData({ agency_name: '', comments: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setFormData({
      agency_name: agency.agency_name,
      comments: agency.comments || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.agency_name.trim()) {
      toast.error('Acenta adı gereklidir');
      return;
    }

    setSaving(true);

    try {
      if (selectedAgency) {
        // Update existing
        const { error } = await supabase
          .from('agencies')
          .update({
            agency_name: formData.agency_name.trim(),
            comments: formData.comments.trim() || null,
          })
          .eq('id', selectedAgency.id);

        if (error) throw error;

        await logAction({
          action: 'UPDATE',
          table_name: 'agencies',
          record_id: selectedAgency.id,
          old_data: { agency_name: selectedAgency.agency_name, comments: selectedAgency.comments },
          new_data: { agency_name: formData.agency_name, comments: formData.comments },
        });

        toast.success('Acenta başarıyla güncellendi');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('agencies')
          .insert({
            agency_name: formData.agency_name.trim(),
            comments: formData.comments.trim() || null,
            balance: 0,
          })
          .select()
          .single();

        if (error) throw error;

        await logAction({
          action: 'CREATE',
          table_name: 'agencies',
          record_id: data.id,
          new_data: { agency_name: formData.agency_name, comments: formData.comments },
        });

        toast.success('Acenta başarıyla oluşturuldu');
      }

      setDialogOpen(false);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Acenta kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgency) return;

    setDeleting(true);

    try {
      // Check if agency has linked reservations
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', selectedAgency.id);

      if (count && count > 0) {
        toast.error(`${count} bağlı rezervasyonu olan acenta silinemez`);
        setDeleting(false);
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', selectedAgency.id);

      if (error) throw error;

      await logAction({
        action: 'DELETE',
        table_name: 'agencies',
        record_id: selectedAgency.id,
        old_data: { agency_name: selectedAgency.agency_name },
      });

      toast.success('Acenta başarıyla silindi');
      setDeleteDialogOpen(false);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Acenta silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Acenteler</h1>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          <Plus className="h-4 w-4 mr-2" />
          Acenta Ekle
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : agencies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz acenta oluşturulmadı</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                İlk Acentayı Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Card key={agency.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {agency.agency_name}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/admin/agency-balance/${agency.id}`)}
                        title="Bakiye Yönet"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/admin/agency-accounting/${agency.id}`)}
                        title="Muhasebe Görüntüle"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(agency)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(agency)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Balance Display */}
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Bakiye</span>
                    <span className={`font-bold ${(agency.balance || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      ₺{(agency.balance || 0).toFixed(2)}
                    </span>
                  </div>

                  {agency.comments && (
                    <p className="text-sm text-muted-foreground">{agency.comments}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgency ? 'Acentayı Düzenle' : 'Acenta Oluştur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Acenta Adı *</Label>
              <Input
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder="Acenta adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label>Notlar / Yorumlar</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Komisyon kuralları, iletişim bilgileri vb."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : selectedAgency ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acentayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedAgency?.agency_name}" acentasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              Bağlı rezervasyonları olan acentalar silinemez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAgencies;
