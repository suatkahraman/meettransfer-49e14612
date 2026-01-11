import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Euro, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePriceThresholds } from '@/hooks/usePriceThresholds';

const VEHICLE_LABELS: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'vip-mercedes': 'VIP Mercedes',
  'maybach-minibus': 'Maybach Minibus',
  'minibus': 'Mercedes Sprinter',
};

const VEHICLE_ICONS: Record<string, string> = {
  'mercedes-vito': '🚐',
  'vip-mercedes': '🚙',
  'maybach-minibus': '✨',
  'minibus': '🚌',
};

export default function AdminPriceThresholds() {
  const navigate = useNavigate();
  const { thresholds, isLoading, updateThreshold } = usePriceThresholds();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const handleValueChange = (id: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = (id: string, vehicleType: string) => {
    const newValue = editedValues[id];
    if (newValue !== undefined) {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue) && numValue > 0) {
        updateThreshold.mutate({ id, min_price_eur: numValue });
        setEditedValues(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
    }
  };

  const getDisplayValue = (threshold: { id: string; min_price_eur: number }) => {
    if (editedValues[threshold.id] !== undefined) {
      return editedValues[threshold.id];
    }
    return String(threshold.min_price_eur);
  };

  const hasChanges = (id: string, originalValue: number) => {
    const editedValue = editedValues[id];
    if (editedValue === undefined) return false;
    return parseFloat(editedValue) !== originalValue;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Minimum Fiyat Eşikleri</h1>
            <p className="text-xs text-muted-foreground">
              Otomatik fiyat uyarı limitleri
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Uyarı Sistemi</p>
                <p className="mt-1">
                  Otomatik fiyatlandırma bu eşiklerin altında bir fiyat hesapladığında,
                  admin panelinde uyarı gösterilir ve manuel fiyat girişi istenir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4">
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {thresholds?.map((threshold) => (
              <Card key={threshold.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">
                        {VEHICLE_ICONS[threshold.vehicle_type] || '🚗'}
                      </span>
                      <div>
                        <p className="font-medium">
                          {VEHICLE_LABELS[threshold.vehicle_type] || threshold.vehicle_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Minimum eşik değeri
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={getDisplayValue(threshold)}
                          onChange={(e) => handleValueChange(threshold.id, e.target.value)}
                          className="w-24 pl-8 text-right"
                          min="0"
                          step="5"
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        variant={hasChanges(threshold.id, Number(threshold.min_price_eur)) ? 'default' : 'ghost'}
                        onClick={() => handleSave(threshold.id, threshold.vehicle_type)}
                        disabled={!hasChanges(threshold.id, Number(threshold.min_price_eur)) || updateThreshold.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nasıl Çalışır?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-bold text-foreground">1.</span>
              <p>Otomatik fiyatlandırma sistemi bir transfer için fiyat hesaplar.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-foreground">2.</span>
              <p>Hesaplanan fiyat, araç tipine göre belirlenen minimum eşiğin altındaysa uyarı gösterilir.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-foreground">3.</span>
              <p>Admin manuel olarak doğru fiyatı girer ve bu fiyat sisteme kaydedilir.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-foreground">4.</span>
              <p>Sonraki benzer transferlerde kaydedilen fiyat otomatik olarak kullanılır.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
