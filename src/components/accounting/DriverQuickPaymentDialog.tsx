import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HandCoins, Wallet } from 'lucide-react';

type PaymentType = 'to_driver' | 'from_driver';

interface DriverQuickPaymentDialogProps {
  driverId: string;
  driverName: string;
  paymentType: PaymentType;
  onPaymentAdded: () => void;
}

export const DriverQuickPaymentDialog = ({ 
  driverId, 
  driverName, 
  paymentType,
  onPaymentAdded 
}: DriverQuickPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isReceiving = paymentType === 'from_driver';
  const title = isReceiving ? 'Ödeme Al' : 'Ödeme Yap';
  const dialogTitle = isReceiving 
    ? `${driverName} - Ödeme Al (Şoförden)` 
    : `${driverName} - Ödeme Yap (Şoföre)`;
  const successMessage = isReceiving 
    ? `${driverName}'den ödeme alındı` 
    : `${driverName}'e ödeme yapıldı`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || amount.trim() === '') {
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
          payment_type: paymentType,
          notes: notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success(successMessage);
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
        <Button 
          variant={isReceiving ? "outline" : "default"} 
          size="sm" 
          className="gap-1.5"
        >
          {isReceiving ? (
            <HandCoins className="h-3.5 w-3.5" />
          ) : (
            <Wallet className="h-3.5 w-3.5" />
          )}
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
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
