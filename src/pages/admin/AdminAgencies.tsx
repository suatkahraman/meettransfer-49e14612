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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Building2, Edit, Trash2, DollarSign, UserPlus, Wallet, Check, X } from 'lucide-react';

interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
  balance: number | null;
  user_id: string | null;
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
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [formData, setFormData] = useState({
    agency_name: '',
    comments: '',
  });
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    phone: '',
  });

  const fetchAgencies = async () => {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('agency_name');
    
    if (error) {
      toast.error('Failed to load agencies');
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

  const openUserDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setUserFormData({ email: '', password: '', phone: '' });
    setUserDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.agency_name.trim()) {
      toast.error('Agency name is required');
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

        toast.success('Agency updated successfully');
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

        toast.success('Agency created successfully');
      }

      setDialogOpen(false);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save agency');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!selectedAgency) return;

    if (!userFormData.email.trim() || !userFormData.password.trim() || !userFormData.phone.trim()) {
      toast.error('All fields are required');
      return;
    }

    if (userFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: userFormData.email.trim(),
          password: userFormData.password,
          role: 'agency',
          name: selectedAgency.agency_name,
          phone: userFormData.phone.trim(),
          agency_id: selectedAgency.id,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await logAction({
        action: 'CREATE_AGENCY_USER',
        table_name: 'agencies',
        record_id: selectedAgency.id,
        new_data: { email: userFormData.email, agency_name: selectedAgency.agency_name },
      });

      toast.success('Agency user account created successfully');
      setUserDialogOpen(false);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agency user');
    } finally {
      setCreatingUser(false);
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
        toast.error(`Cannot delete agency with ${count} linked reservations`);
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

      toast.success('Agency deleted successfully');
      setDeleteDialogOpen(false);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete agency');
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
          <h1 className="text-2xl font-serif">Agencies</h1>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Agency
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : agencies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No agencies created yet</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Agency
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
                        title="Manage Balance"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/admin/agency-accounting/${agency.id}`)}
                        title="View Accounting"
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
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className={`font-bold ${(agency.balance || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      ₺{(agency.balance || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* User Account Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {agency.user_id ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Has Login
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                          <X className="h-3 w-3" />
                          No Login
                        </Badge>
                      )}
                    </div>
                    {!agency.user_id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUserDialog(agency)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Create Login
                      </Button>
                    )}
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
            <DialogTitle>{selectedAgency ? 'Edit Agency' : 'Create Agency'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Agency Name *</Label>
              <Input
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder="Enter agency name"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes / Comments</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Commission rules, contact info, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : selectedAgency ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Account Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Agency Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Create login credentials for <strong>{selectedAgency?.agency_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="agency@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                type="tel"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="+90 5XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAgency?.agency_name}"? This action cannot be undone.
              Agencies with linked reservations cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAgencies;
