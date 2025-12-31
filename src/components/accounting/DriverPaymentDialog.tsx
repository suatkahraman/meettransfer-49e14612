import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
}

interface DriverPaymentDialogProps {
  drivers: Driver[];
  onPaymentAdded: () => void;
}

type PaymentType = 'to_driver' | 'from_driver';

export const DriverPaymentDialog = ({ drivers, onPaymentAdded }: DriverPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('to_driver');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriver || !amount || amount.trim() === '') {
      toast.error('Lütfen şoför ve tutar giriniz');
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
          driver_id: selectedDriver,
          amount: numAmount,
          payment_type: paymentType,
          notes: notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      const driverName = drivers.find(d => d.id === selectedDriver)?.name;
      const successMessage = paymentType === 'to_driver' 
        ? `${driverName}'e ödeme yapıldı` 
        : `${driverName}'den ödeme alındı`;
      
      toast.success(successMessage);
      setOpen(false);
      setSelectedDriver('');
      setAmount('');
      setNotes('');
      setPaymentType('to_driver');
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
        <Button variant="default" className="gap-2">
          <Wallet className="h-4 w-4" />
          Ödeme İşlemi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şoför Ödeme İşlemi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>İşlem Türü</Label>
            <RadioGroup 
              value={paymentType} 
              onValueChange={(value) => setPaymentType(value as PaymentType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="to_driver" id="to_driver" />
                <Label htmlFor="to_driver" className="font-normal cursor-pointer">
                  Ödeme Yap (Şoföre)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="from_driver" id="from_driver" />
                <Label htmlFor="from_driver" className="font-normal cursor-pointer">
                  Ödeme Al (Şoförden)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Şoför Seçin</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Şoför seçin" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Ödeme Tutarı (₺)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
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
