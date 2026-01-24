import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Banknote, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { CustomerPayment } from '@/hooks/useAdminPayments';

interface CustomerPaymentCardProps {
  payment: CustomerPayment;
  index: number;
}

export const getPaymentStatusBadge = (status: string | null, provider: string | null) => {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ödendi {provider && `(${provider})`}
      </Badge>
    );
  }
  if (status === 'partial') {
    return (
      <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        Kısmi
      </Badge>
    );
  }
  if (status === 'pay_on_transfer') {
    return (
      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
        <Banknote className="h-3 w-3 mr-1" />
        Nakit
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
      <Clock className="h-3 w-3 mr-1" />
      Bekliyor
    </Badge>
  );
};

export const CustomerPaymentCard = ({ payment, index }: CustomerPaymentCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
        onClick={() => navigate(`/admin/reservations/${payment.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {payment.reservation_code && (
                  <Badge variant="outline" className="text-xs font-mono">
                    #{payment.reservation_code}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(payment.pickup_date), 'dd MMM yyyy', { locale: tr })}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{payment.customer_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {payment.pickup} → {payment.dropoff}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(payment.price, payment.price_currency)}
                </span>
                {getPaymentStatusBadge(payment.payment_status, payment.payment_provider)}
              </div>
              {payment.payment_completed_at && (
                <p className="text-xs text-muted-foreground">
                  Ödeme: {format(new Date(payment.payment_completed_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
