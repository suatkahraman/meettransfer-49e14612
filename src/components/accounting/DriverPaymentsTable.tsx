import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DriverPayment {
  id: string;
  driver_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  driver_name?: string;
}

interface DriverPaymentsTableProps {
  payments: DriverPayment[];
  showDriver?: boolean;
}

export const DriverPaymentsTable = ({ payments, showDriver = false }: DriverPaymentsTableProps) => {
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
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Not</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {format(new Date(payment.payment_date), 'd MMMM yyyy', { locale: tr })}
              </TableCell>
              {showDriver && (
                <TableCell>
                  <Badge variant="outline">{payment.driver_name || '-'}</Badge>
                </TableCell>
              )}
              <TableCell className="text-right font-medium text-green-600">
                +₺{payment.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {payment.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
