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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, UserX, UserCheck, Phone, MapPin, Percent, Loader2, Eye, Briefcase } from 'lucide-react';

const regions = [
  { value: 'Istanbul', label: 'Istanbul' },
  { value: 'Antalya', label: 'Antalya' },
  { value: 'Bodrum', label: 'Bodrum' },
  { value: 'Dalaman', label: 'Dalaman' },
  { value: 'Izmir', label: 'Izmir' },
  { value: 'Cappadocia', label: 'Cappadocia' },
];

interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  region: string | null;
  commission_rate: number;
  active: boolean;
}

const AdminDrivers = () => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    region: '',
    commission_rate: '70',
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
      region: '',
      commission_rate: '70',
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
      region: driver.region || '',
      commission_rate: driver.commission_rate.toString(),
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
          region: editingDriver.region,
          commission_rate: editingDriver.commission_rate,
        };

        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name,
            phone: formData.phone,
            region: formData.region || null,
            commission_rate: parseFloat(formData.commission_rate),
          })
          .eq('id', editingDriver.id);

        if (error) {
          toast.error('Failed to update driver');
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
              region: formData.region || null,
              commission_rate: parseFloat(formData.commission_rate),
            },
          });

          toast.success('Driver updated');
          setDialogOpen(false);
          fetchDrivers();
        }
      } else {
        // Create new driver via edge function
        if (!formData.email || !formData.password) {
          toast.error('Email and password are required for new drivers');
          return;
        }

        if (!formData.name || !formData.phone) {
          toast.error('Name and phone are required');
          return;
        }

        if (!formData.region) {
          toast.error('Please select a region');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-user-account', {
          body: {
            email: formData.email,
            password: formData.password,
            role: 'driver',
            name: formData.name,
            phone: formData.phone,
            region: formData.region,
            commission_rate: parseFloat(formData.commission_rate) || 70,
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to create driver');
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
            region: formData.region,
            commission_rate: parseFloat(formData.commission_rate),
            email: formData.email,
          },
        });

        toast.success('Driver has been created successfully!');
        setDialogOpen(false);
        fetchDrivers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create driver');
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
      toast.error('Failed to update driver status');
    } else {
      // Audit log for status toggle
      await logAction({
        action: driver.active ? 'DEACTIVATE' : 'ACTIVATE',
        table_name: 'drivers',
        record_id: driver.id,
        old_data: { active: driver.active, name: driver.name },
        new_data: { active: !driver.active, name: driver.name },
      });

      toast.success(driver.active ? 'Driver deactivated' : 'Driver activated');
      fetchDrivers();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Drivers</h1>
        </div>
        <Button onClick={openAddDialog} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No drivers yet</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <Card key={driver.id} className={!driver.active ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{driver.name}</h3>
                      <Badge variant={driver.active ? 'default' : 'secondary'}>
                        {driver.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setViewingDriver(driver);
                          setViewDialogOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openEditDialog(driver)}
                        title="Edit Driver"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => toggleActive(driver)}
                        className={driver.active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                        title={driver.active ? 'Deactivate Driver' : 'Activate Driver'}
                      >
                        {driver.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate(`/admin/drivers/${driver.id}/jobs`)}
                        title="View Assigned Jobs"
                      >
                        <Briefcase className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.phone}</span>
                    </div>
                    {driver.region && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{driver.region}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.commission_rate}% payout</span>
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
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({...formData, region: v})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select region" />
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
            <div className="space-y-2">
              <Label>Driver Payout (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="70"
                value={formData.commission_rate}
                onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                required
              />
              <p className="text-xs text-muted-foreground">Percentage the driver receives from each job</p>
            </div>
            {!editingDriver && (
              <>
                <div className="space-y-2">
                  <Label>Email (for login)</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="driver@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingDriver ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingDriver ? 'Update' : 'Create Driver'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Driver Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
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
                    {viewingDriver.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </span>
                  <span className="font-medium">{viewingDriver.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Region
                  </span>
                  <span className="font-medium">{viewingDriver.region || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" /> Payout Rate
                  </span>
                  <span className="font-medium">{viewingDriver.commission_rate}%</span>
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
              Edit Driver
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDrivers;
