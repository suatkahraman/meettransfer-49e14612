import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { AgencyPayment } from '@/hooks/useAdminPayments';

interface AgencyPaymentCardProps {
  payment: AgencyPayment;
  index: number;
}

export const AgencyPaymentCard = ({ payment, index }: AgencyPaymentCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
        onClick={() => navigate(`/admin/agency-accounting/${payment.agency_id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {payment.agency_name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: tr })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  +{formatCurrency(payment.amount, payment.currency)}
                </span>
                <Badge className="bg-green-500/20 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ödendi
                </Badge>
              </div>
              {payment.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{payment.notes}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
