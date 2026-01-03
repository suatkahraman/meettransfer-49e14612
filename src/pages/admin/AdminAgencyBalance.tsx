import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Wallet, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currency';

interface Agency {
  id: string;
  agency_name: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
  reservation_id: string | null;
  currency: string;
}

interface CurrencyBalance {
  currency: string;
  balance: number;
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'TRY'];

const AdminAgencyBalance = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('EUR');

  const fetchData = async () => {
    if (!agencyId) return;

    // Fetch agency
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .select('id, agency_name, balance, currency')
      .eq('id', agencyId)
      .single();

    if (agencyError) {
      toast.error('Failed to load agency');
      return;
    }

    setAgency(agencyData);
    setTopUpCurrency(agencyData.currency || 'EUR');

    // Fetch transactions
    const { data: txData } = await supabase
      .from('agency_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    setTransactions(txData || []);
    setLoading(false);
  };

  // Calculate balances per currency from transactions
  const currencyBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const currency = tx.currency || 'EUR';
      if (!balances[currency]) {
        balances[currency] = 0;
      }
      if (tx.type === 'top_up') {
        balances[currency] += tx.amount;
      } else {
        balances[currency] -= Math.abs(tx.amount);
      }
    });

    return Object.entries(balances).map(([currency, balance]) => ({
      currency,
      balance
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }, [transactions]);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('agency-balance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agency_transactions', filter: `agency_id=eq.${agencyId}` }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agencies', filter: `id=eq.${agencyId}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId]);

  const handleTopUp = async () => {
    if (!agency || !topUpAmount) return;
    
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);

    try {
      // Find current balance for this currency
      const currentCurrencyBalance = currencyBalances.find(b => b.currency === topUpCurrency);
      const newCurrencyBalance = (currentCurrencyBalance?.balance || 0) + amount;

      // Create transaction record with currency
      const { error: txError } = await supabase
        .from('agency_transactions')
        .insert({
          agency_id: agency.id,
          amount: amount,
          type: 'top_up',
          description: topUpNote || `Balance top-up by admin (${topUpCurrency})`,
          balance_after: newCurrencyBalance,
          currency: topUpCurrency,
        });

      if (txError) throw txError;

      await logAction({
        action: 'INSERT',
        table_name: 'agency_transactions',
        record_id: agency.id,
        new_data: { amount, currency: topUpCurrency, type: 'top_up' },
      });

      toast.success(`Added ${getCurrencySymbol(topUpCurrency)}${amount.toFixed(2)} to ${agency.agency_name}'s balance`);
      setDialogOpen(false);
      setTopUpAmount('');
      setTopUpNote('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add balance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Agency not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/agencies')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-serif">{agency.agency_name}</h1>
            <p className="text-sm opacity-80">Balance Management</p>
          </div>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Balance
        </Button>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-3xl space-y-6">
        {/* Currency Balances Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currencyBalances.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No transactions yet
              </CardContent>
            </Card>
          ) : (
            currencyBalances.map(({ currency, balance }) => (
              <Card key={currency} className={balance < 0 ? 'border-destructive' : 'border-primary'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      balance < 0 ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      <Wallet className={`h-6 w-6 ${balance < 0 ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{currency} Balance</p>
                      <p className={`text-2xl font-bold ${balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {getCurrencySymbol(currency)}{balance.toFixed(2)}
                      </p>
                      {balance < 0 && (
                        <p className="text-xs text-destructive">⚠️ Negative balance</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const currency = tx.currency || 'EUR';
                  const symbol = getCurrencySymbol(currency);
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'top_up' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.type === 'top_up' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.type === 'top_up' ? 'Balance Top-Up' : 'Auto Deduction'}
                            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">{currency}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description || format(new Date(tx.created_at), 'dd MMM yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'top_up' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'top_up' ? '+' : '-'}{symbol}{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {symbol}{tx.balance_after.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Top-Up Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Balance to {agency.agency_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={topUpCurrency} onValueChange={setTopUpCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(cur => (
                    <SelectItem key={cur} value={cur}>
                      {getCurrencySymbol(cur)} {cur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({getCurrencySymbol(topUpCurrency)}) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={topUpNote}
                onChange={(e) => setTopUpNote(e.target.value)}
                placeholder="Payment reference, reason, etc."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopUp} disabled={saving || !topUpAmount}>
              {saving ? 'Adding...' : 'Add Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgencyBalance;
