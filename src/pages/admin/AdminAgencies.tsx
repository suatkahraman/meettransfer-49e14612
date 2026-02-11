import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Building2, Edit, Trash2, DollarSign, Key, Mail, Phone, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { getCurrencySymbol, CURRENCY_OPTIONS } from '@/lib/currency';
import { AgencyReservationsExportDialog } from '@/components/admin/AgencyReservationsExportDialog';

// Fallback exchange rates
const FALLBACK_RATES: Record<string, number> = {
  'EUR': 37.5,
  'USD': 34.5,
  'GBP': 44.1,
  'AED': 9.4,
  'AUD': 22.5,
  'TRY': 1,
};

interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
  balance: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  currency: string;
}

// Currency balances interface for multi-currency support
interface CurrencyBalance {
  currency: string;
  totalAgencyPrice: number;
  totalPassengerCash: number;
  netAgencyDebt: number;
  totalPayments: number;
  calculatedBalance: number;
  tryEquivalent: number;
  exchangeRate: number;
}

interface AgencyWithCalculatedBalance extends Agency {
  calculatedBalance: number;
  totalAgencyPrice: number;
  totalPassengerCash: number;
  netAgencyDebt: number;
  totalPayments: number;
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
  // Multi-currency balances
  currencyBalances: CurrencyBalance[];
  totalTryEquivalent: number;
}

const AdminAgencies = () => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [agencies, setAgencies] = useState<AgencyWithCalculatedBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportAgency, setExportAgency] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    agency_name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    comments: '',
    currency: 'EUR',
  });

  const openExportDialog = (agency: AgencyWithCalculatedBalance) => {
    setExportAgency({ id: agency.id, name: agency.agency_name });
    setExportDialogOpen(true);
  };

  // Fetch exchange rate for a currency to TRY
  const getExchangeRate = async (currency: string): Promise<number> => {
    if (currency === 'TRY') return 1;
    
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${currency}&to=TRY`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.rates?.TRY) {
          return data.rates.TRY;
        }
      }
    } catch (e) {
      console.error(`Exchange rate fetch error for ${currency}:`, e);
    }
    
    return FALLBACK_RATES[currency] || 1;
  };

  const fetchAgencies = async () => {
    // Fetch agencies
    const { data: agenciesData, error: agenciesError } = await supabase
      .from('agencies')
      .select('*')
      .order('agency_name');
    
    if (agenciesError) {
      toast.error('Acenteler yüklenemedi');
      return;
    }

    // Calculate balance for each agency based on completed reservations and payments
    const agenciesWithBalances = await Promise.all(
      (agenciesData || []).map(async (agency) => {
        const balanceCutoffDate = agency.agency_name === 'MEET TRANSFER ONLİNE' ? '2026-01-01' : null;

        // Get completed reservations for this agency (optionally after cutoff date)
        let reservationsQuery = supabase
          .from('reservations')
          .select('id, status, passenger_cash_amount, passenger_cash_currency')
          .eq('agency_id', agency.id)
          .eq('status', 'completed');

        if (balanceCutoffDate) {
          reservationsQuery = reservationsQuery.gte('pickup_date', balanceCutoffDate);
        }

        const { data: reservations } = await reservationsQuery;

        // Group totals by currency
        const currencyTotals: Record<string, { agencyPrice: number; passengerCash: number }> = {};

        if (reservations && reservations.length > 0) {
          // Get agency_reservation_details for these reservations
          const reservationIds = reservations.map(r => r.id);
          const { data: details } = await supabase
            .from('agency_reservation_details')
            .select('reservation_id, customer_price, agency_price_currency')
            .in('reservation_id', reservationIds);

          if (details) {
            details.forEach(d => {
              const currency = d.agency_price_currency || 'TRY';
              if (!currencyTotals[currency]) {
                currencyTotals[currency] = { agencyPrice: 0, passengerCash: 0 };
              }
              currencyTotals[currency].agencyPrice += parseFloat(String(d.customer_price)) || 0;
            });
          }

          // Add passenger cash by currency
          reservations.forEach(r => {
            const currency = r.passenger_cash_currency || 'TRY';
            if (!currencyTotals[currency]) {
              currencyTotals[currency] = { agencyPrice: 0, passengerCash: 0 };
            }
            currencyTotals[currency].passengerCash += parseFloat(String(r.passenger_cash_amount)) || 0;
          });
        }

        // Get total payments received for this agency - grouped by currency (optionally after cutoff date)
        let paymentsQuery = supabase
          .from('agency_payments')
          .select('amount, currency, payment_date')
          .eq('agency_id', agency.id);

        if (balanceCutoffDate) {
          paymentsQuery = paymentsQuery.gte('payment_date', balanceCutoffDate);
        }

        const { data: payments } = await paymentsQuery;

        // Group payments by currency
        const paymentsByCurrency: Record<string, number> = {};
        payments?.forEach(p => {
          const currency = p.currency || 'TRY';
          if (!paymentsByCurrency[currency]) {
            paymentsByCurrency[currency] = 0;
          }
          paymentsByCurrency[currency] += parseFloat(String(p.amount)) || 0;
        });

        const totalPayments = payments?.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0) || 0;

        // Get all unique currencies
        const allCurrencies = new Set([
          ...Object.keys(currencyTotals),
          ...Object.keys(paymentsByCurrency),
        ]);

        // Fetch exchange rates for all currencies
        const exchangeRates: Record<string, number> = {};
        await Promise.all(
          Array.from(allCurrencies).map(async (currency) => {
            exchangeRates[currency] = await getExchangeRate(currency);
          })
        );

        // Calculate currency balances with payments deducted and TRY equivalent
        let totalTryEquivalent = 0;
        const currencyBalances: CurrencyBalance[] = Array.from(allCurrencies).map((currency) => {
          const totals = currencyTotals[currency] || { agencyPrice: 0, passengerCash: 0 };
          const netDebt = totals.agencyPrice - totals.passengerCash;
          const currencyPayments = paymentsByCurrency[currency] || 0;
          const calculatedBalance = netDebt - currencyPayments;
          const exchangeRate = exchangeRates[currency] || 1;
          const tryEquivalent = calculatedBalance * exchangeRate;
          
          totalTryEquivalent += tryEquivalent;

          return {
            currency,
            totalAgencyPrice: totals.agencyPrice,
            totalPassengerCash: totals.passengerCash,
            netAgencyDebt: netDebt,
            totalPayments: currencyPayments,
            calculatedBalance,
            tryEquivalent,
            exchangeRate,
          };
        });

        // Calculate total amounts (legacy - for backward compatibility)
        let totalAgencyPrice = 0;
        let totalPassengerCash = 0;
        Object.values(currencyTotals).forEach(totals => {
          totalAgencyPrice += totals.agencyPrice;
          totalPassengerCash += totals.passengerCash;
        });

        // Calculate net agency debt: total agency prices - passenger cash
        const netAgencyDebt = totalAgencyPrice - totalPassengerCash;
        // Calculate remaining balance: net debt - payments received
        const calculatedBalance = netAgencyDebt - totalPayments;

        // Fetch contact info from profile if user_id exists
        let contactEmail: string | null = null;
        let contactPhone: string | null = null;
        let contactName: string | null = null;
        
        if (agency.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', agency.user_id)
            .single();
          
          if (profile) {
            contactPhone = profile.phone;
            contactName = profile.full_name;
          }
          
          // Get email from auth (we'll use a function call for this)
          try {
            const { data: emailData } = await supabase.functions.invoke('get-driver-email', {
              body: { user_id: agency.user_id },
            });
            if (emailData?.email) {
              contactEmail = emailData.email;
            }
          } catch (e) {
            console.error('Failed to fetch agency email:', e);
          }
        }

        return {
          ...agency,
          calculatedBalance,
          totalAgencyPrice,
          totalPassengerCash,
          netAgencyDebt,
          totalPayments,
          contactEmail,
          contactPhone,
          contactName,
          currencyBalances,
          totalTryEquivalent,
        };
      })
    );

    setAgencies(agenciesWithBalances);
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
    setFormData({ agency_name: '', email: '', password: '', phone: '', city: '', comments: '', currency: 'EUR' });
    setDialogOpen(true);
  };

  const openEditDialog = (agency: AgencyWithCalculatedBalance) => {
    setSelectedAgency(agency);
    setFormData({
      agency_name: agency.agency_name,
      email: '',
      password: '',
      phone: '',
      city: '',
      comments: agency.comments || '',
      currency: (agency as any).currency || 'EUR',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setDeleteDialogOpen(true);
  };

  const openPasswordDialog = (agency: Agency) => {
    if (!agency.user_id) {
      toast.error('Bu acentanın hesabı bulunamadı');
      return;
    }
    setSelectedAgency(agency);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handlePasswordUpdate = async () => {
    if (!selectedAgency?.user_id) return;

    if (!newPassword.trim()) {
      toast.error('Yeni şifre gereklidir');
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setUpdatingPassword(true);

    try {
      const response = await supabase.functions.invoke('update-user-password', {
        body: {
          user_id: selectedAgency.user_id,
          new_password: newPassword.trim(),
        },
      });
      const data = response.data as { success?: boolean; error?: string } | null;
      if (response.error) throw new Error(response.error.message || 'Şifre güncellenemedi');
      if (data && data.success === false) throw new Error(data.error || 'Şifre güncellenemedi');

      await logAction({
        action: 'UPDATE_PASSWORD',
        table_name: 'agencies',
        record_id: selectedAgency.id,
        new_data: { password_changed: true },
      });

      toast.success('Şifre başarıyla güncellendi');
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Şifre güncellenemedi');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!formData.agency_name.trim()) {
      toast.error('Acenta adı gereklidir');
      return;
    }

    // Validate email, password and phone for new agency creation
    if (!selectedAgency) {
      if (!formData.email.trim()) {
        toast.error('E-posta adresi gereklidir');
        return;
      }
      if (!formData.password.trim()) {
        toast.error('Şifre gereklidir');
        return;
      }
      if (formData.password.trim().length < 6) {
        toast.error('Şifre en az 6 karakter olmalıdır');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Telefon numarası gereklidir');
        return;
      }
      // Basic email validation - only ASCII characters allowed
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error('Geçerli bir e-posta adresi girin (Türkçe karakter kullanmayın)');
        return;
      }
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
            currency: formData.currency,
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
        // Create new agency with user account
        const { data: session } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke('create-user-account', {
          body: {
            email: formData.email.trim().toLowerCase(),
            password: formData.password.trim(),
            full_name: formData.agency_name.trim(),
            phone: formData.phone.trim(),
            role: 'agency',
            agency_name: formData.agency_name.trim(),
            agency_comments: formData.comments.trim() || null,
            agency_currency: formData.currency,
            agency_city: formData.city.trim() || null,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Acenta hesabı oluşturulamadı');
        }

        await logAction({
          action: 'CREATE',
          table_name: 'agencies',
          record_id: response.data?.agency_id || 'unknown',
          new_data: { agency_name: formData.agency_name, email: formData.email },
        });

        toast.success('Acenta ve hesabı başarıyla oluşturuldu');
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
              <Card key={agency.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/admin/agency-accounting/${agency.id}`)}>
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
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/agency-accounting/${agency.id}`); }}
                        title="Muhasebe Görüntüle"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openExportDialog(agency); }}
                        title="Rezervasyonları Excel'e Aktar"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      {agency.user_id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openPasswordDialog(agency); }}
                          title="Şifre Değiştir"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditDialog(agency); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(agency); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Simplified Balance Display */}
                  {agency.currencyBalances && agency.currencyBalances.length > 0 ? (
                    <div className="space-y-2">
                      {agency.currencyBalances
                        .filter(cb => cb.totalAgencyPrice !== 0 || cb.calculatedBalance !== 0)
                        .map((cb) => {
                          const symbol = getCurrencySymbol(cb.currency);
                          const isDebt = cb.calculatedBalance > 0;
                          return (
                            <div key={cb.currency} className="p-3 bg-muted/50 rounded-lg">
                              <span className="text-xs text-muted-foreground">
                                Güncel Bakiye ({cb.currency})
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-lg font-bold ${isDebt ? 'text-red-600' : cb.calculatedBalance < 0 ? 'text-green-600' : 'text-foreground'}`}>
                                  {symbol}{Math.abs(cb.calculatedBalance).toFixed(2)}
                                </span>
                                {isDebt && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    Acenta borçlu
                                  </Badge>
                                )}
                                {cb.calculatedBalance < 0 && (
                                  <Badge className="bg-green-500/20 text-green-700 text-[10px] px-1.5 py-0">
                                    Alacaklı
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      
                      {/* Show zero balance if all currencies are zero */}
                      {agency.currencyBalances.every(cb => cb.totalAgencyPrice === 0 && cb.calculatedBalance === 0) && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">
                            Güncel Bakiye ({agency.currency})
                          </span>
                          <div className="mt-1">
                            <span className="text-lg font-bold text-foreground">
                              {getCurrencySymbol(agency.currency)}0.00
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        Güncel Bakiye ({agency.currency})
                      </span>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-foreground">
                          {getCurrencySymbol(agency.currency)}0.00
                        </span>
                      </div>
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
            {!selectedAgency && (
              <>
                <div className="space-y-2">
                  <Label>E-posta Adresi (Kullanıcı Adı) *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="acenta@example.com"
                  />
                  <p className="text-xs text-muted-foreground">Türkçe karakter kullanmayın</p>
                </div>
                <div className="space-y-2">
                  <Label>Şifre *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon Numarası *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Örn: İstanbul, Antalya, İzmir"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Para Birimi *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.symbol} {currency.label.split(' - ')[1] || currency.value} ({currency.value})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Acenta panelinde kullanılacak para birimi</p>
                </div>
              </>
            )}
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

      {/* Password Update Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedAgency?.agency_name}</strong> için yeni şifre belirleyin.
            </p>
            <div className="space-y-2">
              <Label>Yeni Şifre *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handlePasswordUpdate} disabled={updatingPassword}>
              {updatingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Reservations Dialog */}
      {exportAgency && (
        <AgencyReservationsExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          agencyId={exportAgency.id}
          agencyName={exportAgency.name}
        />
      )}
    </div>
  );
};

export default AdminAgencies;
