import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from 'lucide-react';
import { type WebVitalsResult } from '@/hooks/useCoreWebVitals';

interface SEODebugVitalsTabProps {
  vitalsResult: WebVitalsResult | null;
}

export const SEODebugVitalsTab = ({ vitalsResult }: SEODebugVitalsTabProps) => {
  if (!vitalsResult) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz Web Vitals ölçümü yapılmadı. Yukarıdaki "Vitals Ölç" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={vitalsResult.overallScore === 'good' ? 'border-green-500' : vitalsResult.overallScore === 'needs-improvement' ? 'border-yellow-500' : 'border-destructive'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Core Web Vitals - {vitalsResult.overallScore === 'good' ? 'İyi' : vitalsResult.overallScore === 'needs-improvement' ? 'Orta' : 'Zayıf'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {vitalsResult.metrics.map(metric => (
              <div key={metric.name} className={`p-3 rounded-lg ${metric.rating === 'good' ? 'bg-green-50 dark:bg-green-950' : metric.rating === 'needs-improvement' ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-red-50 dark:bg-red-950'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{metric.name}</span>
                  <Badge variant={metric.rating === 'good' ? 'default' : metric.rating === 'needs-improvement' ? 'secondary' : 'destructive'} className="text-xs">
                    {metric.rating === 'good' ? 'İyi' : metric.rating === 'needs-improvement' ? 'Orta' : 'Zayıf'}
                  </Badge>
                </div>
                <div className={`text-xl font-bold ${metric.rating === 'good' ? 'text-green-600' : metric.rating === 'needs-improvement' ? 'text-yellow-600' : 'text-destructive'}`}>
                  {metric.name === 'CLS' ? metric.value.toFixed(3) : `${metric.value}ms`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
