import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Building2, Clock, Mail, Phone, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AgencyApplication {
  id: string;
  agency_name: string;
  contact_name: string;
  email: string;
  phone: string;
  currency: string;
  comments: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

const AdminAgencyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<AgencyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgencyApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('agency_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Başvurular yüklenemedi');
      return;
    }

    setApplications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel('agency-applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (application: AgencyApplication) => {
    setProcessing(application.id);

    try {
      const response = await supabase.functions.invoke('approve-agency-application', {
        body: { application_id: application.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Başvuru onaylanamadı');
      }

      toast.success('Başvuru onaylandı ve hesap oluşturuldu');
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Başvuru onaylanamadı');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (application: AgencyApplication) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    setProcessing(selectedApplication.id);

    try {
      const response = await supabase.functions.invoke('reject-agency-application', {
        body: { 
          application_id: selectedApplication.id,
          rejection_reason: rejectionReason.trim() || undefined
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Başvuru reddedilemedi');
      }

      toast.success('Başvuru reddedildi');
      setRejectDialogOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Başvuru reddedilemedi');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Bekliyor</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  // Only show rejected applications in processed list (approved ones are already in agencies)
  const processedApplications = applications.filter(app => app.status === 'rejected');

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
          <h1 className="text-2xl font-serif">Acenta Başvuruları</h1>
        </div>
        {pendingApplications.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingApplications.length} Bekleyen
          </Badge>
        )}
      </header>

      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz başvuru yok</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Bekleyen Başvurular
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingApplications.map((application) => (
                    <Card key={application.id} className="border-yellow-200 bg-yellow-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {application.agency_name}
                          </span>
                          {getStatusBadge(application.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium text-foreground">{application.contact_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{application.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{application.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Para Birimi: {application.currency}</span>
                          </div>
                          {application.comments && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground">{application.comments}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground pt-1">
                            Başvuru: {format(new Date(application.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleApprove(application)} 
                            disabled={processing === application.id}
                            className="flex-1"
                            size="sm"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => openRejectDialog(application)}
                            disabled={processing === application.id}
                            className="flex-1"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Applications */}
            {processedApplications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reddedilen Başvurular</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {processedApplications.map((application) => (
                    <Card key={application.id} className={application.status === 'approved' ? 'border-green-200' : 'border-red-200'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-base">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            {application.agency_name}
                          </span>
                          {getStatusBadge(application.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="text-muted-foreground">{application.contact_name}</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{application.email}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Başvuru: {format(new Date(application.created_at), 'dd MMM yyyy', { locale: tr })}
                          {application.reviewed_at && (
                            <span> • İşlem: {format(new Date(application.reviewed_at), 'dd MMM yyyy', { locale: tr })}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              "{selectedApplication?.agency_name}" başvurusunu reddetmek istediğinize emin misiniz?
            </p>
            <div className="space-y-2">
              <Label>Red Nedeni (İsteğe bağlı)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Başvuru sahibine iletilecek neden..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing === selectedApplication?.id}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgencyApplications;
