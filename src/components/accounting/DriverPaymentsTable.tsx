import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyInput } from '@/components/ui/money-input';
import { parseMoneyInput } from '@/lib/money';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { getCurrencySymbol } from '@/lib/currency';

interface DriverPayment {
  id: string;
  driver_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  driver_name?: string;
  payment_type?: string;
}

interface DriverPaymentsTableProps {
  payments: DriverPayment[];
  showDriver?: boolean;
  onPaymentDeleted?: () => void;
  onPaymentUpdated?: () => void;
}

export const DriverPaymentsTable = ({ 
  payments, 
  showDriver = false, 
  onPaymentDeleted,
  onPaymentUpdated 
}: DriverPaymentsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<DriverPayment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentType, setEditPaymentType] = useState<string>('to_driver');
  const [saving, setSaving] = useState(false);

  const handleDelete = async (paymentId: string) => {
    setDeletingId(paymentId);
    try {
      const { error } = await supabase
        .from('driver_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast.success('Ödeme başarıyla silindi');
      onPaymentDeleted?.();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error('Ödeme silinirken hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (payment: DriverPayment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditNotes(payment.notes || '');
    setEditPaymentType(payment.payment_type || 'to_driver');
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;

    const numAmount = parseMoneyInput(editAmount);
    if (numAmount === null || numAmount <= 0) {
      toast.error('Geçerli bir tutar giriniz');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('driver_payments')
        .update({
          amount: numAmount,
          notes: editNotes || null,
          payment_type: editPaymentType,
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast.success('Ödeme başarıyla güncellendi');
      setEditingPayment(null);
      onPaymentUpdated?.();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error('Ödeme güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu dönemde ödeme bulunmamaktadır.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              {showDriver && <TableHead>Şoför</TableHead>}
              <TableHead>Tür</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Not</TableHead>
              <TableHead className="w-[80px]">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const isFromDriver = payment.payment_type === 'from_driver';
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'd MMMM yyyy', { locale: tr })}
                  </TableCell>
                  {showDriver && (
                    <TableCell>
                      <Badge variant="outline">{payment.driver_name || '-'}</Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={isFromDriver ? 'default' : 'secondary'}>
                      {isFromDriver ? 'Alınan' : 'Yapılan'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${isFromDriver ? 'text-green-600' : 'text-red-600'}`}>
                    {isFromDriver ? '+' : '-'}{getCurrencySymbol('TRY')}{payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(payment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === payment.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ödemeyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve şoför bakiyesi otomatik olarak güncellenecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(payment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>İşlem Türü</Label>
              <Select value={editPaymentType} onValueChange={setEditPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_driver">Ödeme Yapılan (Şoföre)</SelectItem>
                  <SelectItem value="from_driver">Ödeme Alınan (Şoförden)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tutar</Label>
              <MoneyInput
                value={editAmount}
                onValueChange={setEditAmount}
                currencySymbol={getCurrencySymbol('TRY')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Not (opsiyonel)</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ödeme ile ilgili not..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>
                İptal
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
