import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, Wallet } from 'lucide-react';
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
  
  const balance = payment.agency_balance ?? 0;
  const isDebt = balance > 0;
  const isCredit = balance < 0;

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
            <div className="flex-1 min-w-0 space-y-2">
              {/* Agency name & date */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {payment.agency_name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: tr })}
                </span>
              </div>
              
              {/* Current Balance */}
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Güncel Bakiye ({payment.agency_currency})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDebt ? 'text-red-600' : isCredit ? 'text-green-600' : 'text-foreground'}`}>
                      {formatCurrency(Math.abs(balance), payment.agency_currency, { showDecimal: true })}
                    </span>
                    {isDebt && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Acenta borçlu
                      </Badge>
                    )}
                    {isCredit && (
                      <Badge className="bg-green-500/20 text-green-700 text-[10px] px-1.5 py-0">
                        Alacaklı
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Payment amount */}
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
