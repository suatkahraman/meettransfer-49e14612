import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import { motion } from 'framer-motion';

const AgencyPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAgencyTranslations();
  
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'EUR';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl text-green-600">Ödeme Başarılı!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {amount && (
              <div className="py-4 px-6 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ödenen Tutar</p>
                <p className="text-3xl font-bold text-green-600">
                  {getCurrencySymbol(currency)}{parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <p className="text-muted-foreground">
              Ödemeniz başarıyla alındı. Bakiyeniz güncellenecektir.
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => navigate('/agency/transactions')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                İşlem Geçmişine Dön
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/agency')}
                className="w-full"
              >
                Ana Sayfaya Git
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AgencyPaymentSuccess;
