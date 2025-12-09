import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_cash_amount: number | null;
  status: string;
  customer_name: string;
}

interface MonthlyAccountingTableProps {
  reservations: Reservation[];
  showActions?: boolean;
  onEdit?: (reservation: Reservation) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'assigned': 
    case 'sent_to_driver': return 'bg-blue-100 text-blue-800';
    case 'active': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number | null, currency: string | null) => {
  if (amount === null) return '-';
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₺';
  return `${symbol}${amount.toFixed(2)}`;
};

export const MonthlyAccountingTable = ({ reservations, showActions, onEdit }: MonthlyAccountingTableProps) => {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reservations found for this month
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Route</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Cash Collected</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell className="whitespace-nowrap">
                <div className="font-medium">
                  {format(new Date(reservation.pickup_date), 'MMM d')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reservation.pickup_time}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium truncate max-w-[150px]">{reservation.pickup}</div>
                  <div className="text-muted-foreground truncate max-w-[150px]">→ {reservation.dropoff}</div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(reservation.price, reservation.price_currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(reservation.driver_cash_amount, reservation.price_currency)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(reservation.status)}>
                  {reservation.status}
                </Badge>
              </TableCell>
              {showActions && onEdit && (
                <TableCell>
                  <button
                    onClick={() => onEdit(reservation)}
                    className="text-primary hover:underline text-sm"
                  >
                    Edit
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
