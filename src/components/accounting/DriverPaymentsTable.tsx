import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

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
}

export const DriverPaymentsTable = ({ payments, showDriver = false, onPaymentDeleted }: DriverPaymentsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu dönemde ödeme bulunmamaktadır.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            {showDriver && <TableHead>Şoför</TableHead>}
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Not</TableHead>
            <TableHead className="w-[50px]"></TableHead>
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
                  {isFromDriver ? '+' : '-'}₺{payment.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {payment.notes || '-'}
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
