import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HandCoins } from 'lucide-react';

interface DriverQuickPaymentDialogProps {
  driverId: string;
  driverName: string;
  onPaymentAdded: () => void;
}

export const DriverQuickPaymentDialog = ({ driverId, driverName, onPaymentAdded }: DriverQuickPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Lütfen tutar giriniz');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Geçerli bir tutar giriniz');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('driver_payments')
        .insert({
          driver_id: driverId,
          amount: numAmount,
          notes: notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success(`${driverName} için ödeme kaydedildi`);
      setOpen(false);
      setAmount('');
      setNotes('');
      onPaymentAdded();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HandCoins className="h-3.5 w-3.5" />
          Ödeme Al
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driverName} - Ödeme Al</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ödeme Tutarı (₺)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>Not (opsiyonel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ödeme ile ilgili not..."
              rows={2}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
