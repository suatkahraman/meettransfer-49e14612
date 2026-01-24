import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Banknote,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { AgencyPaymentHistoryItem } from '@/hooks/useAgencyPayments';
import { motion } from 'framer-motion';

interface AgencyPaymentHistoryCardProps {
  reservation: AgencyPaymentHistoryItem;
  index: number;
  onClick: () => void;
  language: 'TR' | 'EN';
}

const translations = {
  EN: {
    paid: 'Paid',
    pending: 'Pending',
    cashToDriver: 'Cash to Driver',
    customer: 'Customer',
    paidAt: 'Paid at',
  },
  TR: {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    cashToDriver: 'Şoföre Nakit',
    customer: 'Müşteri',
    paidAt: 'Ödeme',
  }
};

export const AgencyPaymentHistoryCard = ({ 
  reservation, 
  index, 
  onClick,
  language 
}: AgencyPaymentHistoryCardProps) => {
  const t = translations[language];

  const getCompanyAmount = (): number => {
    return reservation.agency_reservation_details?.company_amount || reservation.price || 0;
  };

  const getCurrency = (): string => {
    return reservation.agency_reservation_details?.agency_price_currency || reservation.price_currency || 'EUR';
  };

  const getPaymentStatus = (): string | null => {
    return reservation.agency_reservation_details?.payment_status || reservation.payment_status;
  };

  const status = getPaymentStatus();
  const provider = reservation.payment_provider;

  const getPaymentStatusBadge = () => {
    if (status === 'paid') {
      return (
        <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.paid} {provider && `(${provider})`}
        </Badge>
      );
    }
    if (status === 'pay_on_transfer' || reservation.payment_status === 'pay_on_transfer') {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
          <Banknote className="h-3 w-3 mr-1" />
          {t.cashToDriver}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const displayPickup = reservation.pickup_place_name || reservation.pickup;
  const displayDropoff = reservation.dropoff_place_name || reservation.dropoff;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {reservation.reservation_code && (
                  <Badge variant="outline" className="text-xs font-mono">
                    #{reservation.reservation_code}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(reservation.pickup_date), 'dd MMM yyyy')}
                </span>
              </div>
              
              {/* Route */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium line-clamp-2">
                  {displayPickup} → {displayDropoff}
                </p>
              </div>
              
              {/* Customer */}
              <p className="text-xs text-muted-foreground">
                {t.customer}: {reservation.customer_name}
              </p>
              
              {/* Amount and Status Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-primary">
                  {formatCurrency(getCompanyAmount(), getCurrency())}
                </span>
                {getPaymentStatusBadge()}
              </div>
              
              {/* Payment Date */}
              {reservation.payment_completed_at && (
                <p className="text-xs text-muted-foreground">
                  {t.paidAt}: {format(new Date(reservation.payment_completed_at), 'dd MMM yyyy HH:mm')}
                </p>
              )}
            </div>
            
            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
