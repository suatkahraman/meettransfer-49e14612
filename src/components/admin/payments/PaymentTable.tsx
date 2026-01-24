import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';
import { CustomerPayment, AgencyPayment } from '@/hooks/useAdminPayments';
import { getPaymentStatusBadge } from './CustomerPaymentCard';
import { CheckCircle, Building2 } from 'lucide-react';

interface CustomerPaymentTableProps {
  payments: CustomerPayment[];
}

interface AgencyPaymentTableProps {
  payments: AgencyPayment[];
}

export const CustomerPaymentTable = ({ payments }: CustomerPaymentTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Kod</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead className="hidden md:table-cell">Güzergah</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="hidden md:table-cell">Ödeme Tarihi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow 
              key={payment.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/reservations/${payment.id}`)}
            >
              <TableCell className="font-mono text-xs">
                {payment.reservation_code ? `#${payment.reservation_code}` : '-'}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{payment.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{payment.customer_phone}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="text-xs truncate max-w-[200px]">
                  {payment.pickup} → {payment.dropoff}
                </p>
              </TableCell>
              <TableCell className="text-xs">
                {format(new Date(payment.pickup_date), 'dd MMM yyyy', { locale: tr })}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {formatCurrency(payment.price, payment.price_currency)}
              </TableCell>
              <TableCell>
                {getPaymentStatusBadge(payment.payment_status, payment.payment_provider)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                {payment.payment_completed_at 
                  ? format(new Date(payment.payment_completed_at), 'dd MMM HH:mm', { locale: tr })
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export const AgencyPaymentTable = ({ payments }: AgencyPaymentTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acenta</TableHead>
            <TableHead>Ödeme Tarihi</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="hidden md:table-cell">Notlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow 
              key={payment.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/agency-accounting/${payment.agency_id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{payment.agency_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: tr })}
              </TableCell>
              <TableCell className="text-right font-bold text-green-600">
                +{formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell>
                <Badge className="bg-green-500/20 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ödendi
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                {payment.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
