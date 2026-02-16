/**
 * Admin Panel - KM Hesaplama Bölümü
 * - Şehir/Havalimanı: Google Places ile ekleme
 * - Tüm araç tipleri için fiyat
 * - Tarih aralığı (valid_from, valid_to)
 * - Min KM - Max KM aralığı
 * - Havalimanı baz fiyat (airport_extra_fee)
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, MapPin, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';
import { VEHICLE_TYPE_OPTIONS } from '@/lib/vehicleTypes';

const CITIES = [
  "Istanbul", "Ankara", "Antalya", "Bodrum", "Dalaman", "Izmir", "Bursa", 
  "Yalova", "Sapanca", "Adana", "Gaziantep", "Trabzon", "Diyarbakir", "Van", 
  "Malatya", "Samsun", "Kocaeli", "Tekirdag", "Edirne", "Kars", "Denizli", 
  "Elazig", "Sivas", "Sinop", "Kastamonu", "Zonguldak", "Sirnak", "Agri", 
  "Mardin", "Afyon", "Mus", "Erzurum", "Erzincan", "Sanliurfa", "Hatay", 
  "Balikesir", "Canakkale", "Ordu", "Rize", "Dubai"
];

import { Database } from '@/integrations/supabase/types';

type DistancePricingRuleRow = Database['public']['Tables']['distance_pricing_rules']['Row'];

export interface DistancePricingRule extends Omit<DistancePricingRuleRow, 'pricing_mode'> {
  pricing_mode: 'fixed' | 'distance';
}

export default function DistancePricingRulesManager() {
  const [rules, setRules] = useState<DistancePricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DistancePricingRule | null>(null);
  const [editingGroup, setEditingGroup] = useState<DistancePricingRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [city, setCity] = useState('');
  const [airportCode, setAirportCode] = useState('');
  const [minKm, setMinKm] = useState('');
  const [maxKm, setMaxKm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricingMode, setPricingMode] = useState<'fixed' | 'distance'>('fixed');
  
  // Araç bazlı fiyatlar
  // fixed -> base_price
  // distance -> extra_km_price
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, string>>({
    'sedan': '',
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });

  const [tableError, setTableError] = useState<string | null>(null);

  const fetchRules = async () => {
    setTableError(null);
    try {
      const { data, error } = await supabase
        .from('distance_pricing_rules')
        .select('id,vehicle_type,city,airport_code,pricing_mode,base_price,extra_km_price,min_km,max_km,start_date,end_date,created_at')
        .order('city', { ascending: true })
        .order('min_km', { ascending: true });

      if (error) throw error;
      
      // Veritabanından gelen veriyi (string) arayüz tipine (union) dönüştür
      const typedData = (data || []).map(row => ({
        ...row,
        pricing_mode: (row.pricing_mode as 'fixed' | 'distance')
      }));
      
      setRules(typedData);
    } catch (err: unknown) {
      console.error('Error fetching distance pricing rules:', err);
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : '';
      if (msg.includes('distance_pricing_rules') && (msg.includes('not exist') || msg.includes('schema cache') || msg.includes('42P01'))) {
        setTableError('TABLO_YOK');
      } else {
        toast.error('Kurallar yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const resetForm = () => {
    setCity('');
    setAirportCode('');
    setMinKm('');
    setMaxKm('');
    setStartDate('');
    setEndDate('');
    setPricingMode('fixed');
    setVehiclePrices({
      'sedan': '',
      'mercedes-vito': '',
      'vip-mercedes': '',
      'maybach-minibus': '',
      'minibus': '',
    });
    setEditingRule(null);
    setEditingGroup([]);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: DistancePricingRule) => {
    // Gruplama anahtarı
    const groupKey = `${rule.city || ''}|${rule.airport_code || ''}|${rule.min_km ?? 0}|${rule.max_km ?? '-'}|${rule.start_date ?? ''}|${rule.end_date ?? ''}|${rule.pricing_mode}`;
    
    const group = rules.filter(r =>
      `${r.city || ''}|${r.airport_code || ''}|${r.min_km ?? 0}|${r.max_km ?? '-'}|${r.start_date ?? ''}|${r.end_date ?? ''}|${r.pricing_mode}` === groupKey
    );
    
    setEditingGroup(group);
    setEditingRule(rule);
    
    setCity(rule.city || '');
    setAirportCode(rule.airport_code || '');
    setMinKm(rule.min_km != null ? String(rule.min_km) : '');
    setMaxKm(rule.max_km != null ? String(rule.max_km) : '');
    setStartDate(rule.start_date || '');
    setEndDate(rule.end_date || '');
    setPricingMode(rule.pricing_mode || 'fixed');

    const prices: Record<string, string> = {
      'sedan': '', 'mercedes-vito': '', 'vip-mercedes': '', 'maybach-minibus': '', 'minibus': '',
    };
    
    const revMap: Record<string, string> = {
      'Standard Sedan': 'sedan',
      'Mercedes Vito or Similar': 'mercedes-vito',
      'Mercedes Maybach': 'maybach-minibus',
      'Mercedes Sprinter or Similar': 'minibus',
    };
    
    for (const r of group) {
      const canonical = r.vehicle_type || '';
      const key = revMap[canonical];
      if (key) {
        if (r.pricing_mode === 'distance') {
            prices[key] = r.extra_km_price != null ? String(r.extra_km_price) : '';
        } else {
            prices[key] = r.base_price != null ? String(r.base_price) : '';
        }
      }
    }
    setVehiclePrices(prices);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!city) {
      toast.error('Lütfen şehir seçin');
      return;
    }
    const min = parseFloat(minKm);
    const max = maxKm ? parseFloat(maxKm) : null;
    if (isNaN(min) || min < 0) {
      toast.error('Min KM geçerli bir sayı olmalı');
      return;
    }
    if (max != null && (isNaN(max) || max < min)) {
      toast.error('Max KM, Min KM\'den büyük veya eşit olmalı');
      return;
    }
    const hasAnyPrice = Object.values(vehiclePrices).some(p => parseFloat(p || '0') > 0);
    if (!hasAnyPrice) {
      toast.error('En az bir araç için fiyat girin');
      return;
    }

    setSaving(true);
    try {
      const startDateVal = startDate || null;
      const endDateVal = endDate || null;
      const cityVal = city || null;
      const airportCodeVal = airportCode.trim() || null;

      if (editingRule && editingGroup.length > 0) {
        // Grup güncelleme
        const revMap: Record<string, string> = {
          'Standard Sedan': 'sedan',
          'Mercedes Vito or Similar': 'mercedes-vito',
          'Mercedes Maybach': 'maybach-minibus',
          'VIP Mercedes': 'vip-mercedes',
          'Mercedes Sprinter or Similar': 'minibus',
        };
        
        const updatePayload = {
          city: cityVal,
          airport_code: airportCodeVal,
          min_km: min,
          max_km: max,
          start_date: startDateVal,
          end_date: endDateVal,
          pricing_mode: pricingMode,
          // Diğer alanları null yapalım ki karışıklık olmasın
          base_price: null as number | null,
          extra_km_price: null as number | null,
        };

        for (const r of editingGroup) {
          const canonical = (r.vehicle_type || '').trim();
          const key = revMap[canonical];
          const priceVal = key ? parseFloat(vehiclePrices[key] || '0') : 0;
          
          const finalPayload = { ...updatePayload };
          if (pricingMode === 'distance') {
            finalPayload.extra_km_price = priceVal;
          } else {
            finalPayload.base_price = priceVal;
          }

          const { error } = await supabase
            .from('distance_pricing_rules')
            .update(finalPayload)
            .eq('id', r.id);
          if (error) throw error;
        }
      } else {
        // Yeni kurallar
        const toInsert: any[] = [];
        const seenCanonical = new Set<string>();
        const canonicalOrder: Array<[string, string]> = [
          ['sedan', 'Standard Sedan'],
          ['mercedes-vito', 'Mercedes Vito or Similar'],
          ['maybach-minibus', 'Mercedes Maybach'],
          ['vip-mercedes', 'Mercedes Maybach'],
          ['minibus', 'Mercedes Sprinter or Similar'],
        ];

        for (const [vtKey, canonical] of canonicalOrder) {
          const p = parseFloat(vehiclePrices[vtKey] || '0');
          if (p <= 0) continue;
          if (seenCanonical.has(canonical)) continue;
          seenCanonical.add(canonical);

          const payload: any = {
            vehicle_type: canonical,
            city: cityVal,
            airport_code: airportCodeVal,
            min_km: min,
            max_km: max,
            start_date: startDateVal,
            end_date: endDateVal,
            pricing_mode: pricingMode,
          };

          if (pricingMode === 'distance') {
            payload.extra_km_price = p;
            payload.base_price = null;
          } else {
            payload.base_price = p;
            payload.extra_km_price = null;
          }

          toInsert.push(payload);
        }

        if (toInsert.length === 0) {
          toast.error('En az bir araç için fiyat girin');
          setSaving(false);
          return;
        }

        const { error } = await supabase.from('distance_pricing_rules').insert(toInsert);
        if (error) throw error;
      }

      const dateRangeMsg = startDateVal && endDateVal ? ` (${startDateVal} - ${endDateVal})` : '';
      toast.success(`Kurallar kaydedildi${dateRangeMsg}`);
      setIsDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (err) {
      console.error('Error saving rules:', err);
      toast.error('Kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group: DistancePricingRule[]) => {
    if (!confirm(`Bu konum için ${group.length} kural silinecek. Emin misiniz?`)) return;
    try {
      const ids = group.map(r => r.id);
      const { error } = await supabase.from('distance_pricing_rules').delete().in('id', ids);
      if (error) throw error;
      toast.success('Kurallar silindi');
      fetchRules();
    } catch (err) {
      console.error('Error deleting rules:', err);
      toast.error('Silinirken hata oluştu');
    }
  };

  // Grupla: city + airport_code + min_km + max_km + tarih + pricing_mode
  const groupedRules = rules.reduce<Record<string, DistancePricingRule[]>>((acc, r) => {
    const key = `${r.city || 'Genel'}|${r.airport_code || ''}|${r.min_km ?? 0}|${r.max_km ?? '-'}|${r.start_date ?? ''}|${r.end_date ?? ''}|${r.pricing_mode}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          KM Bazlı Fiyat Kuralları (Yeni Sistem)
        </CardTitle>
        <CardDescription>
          Şehir, Havalimanı, Tarih ve KM aralığına göre fiyatlandırma kuralları.
        </CardDescription>
        <Button size="sm" onClick={openNewDialog} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kural Ekle
        </Button>
      </CardHeader>
      <CardContent>
        {tableError === 'TABLO_YOK' ? (
          <div className="py-8 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
              <p className="font-medium text-amber-800 dark:text-amber-200">Supabase Tablosu Eksik/Uyumsuz</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Tablo şeması değişmiş olabilir. Lütfen SQL editörden kontrol edin.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setTableError(null); fetchRules(); }}>
                Tekrar Dene
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : rules.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Henüz kural yok. Yeni kural ekleyerek başlayın.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([key, group]) => {
              const parts = key.split('|');
              const [cityName, airportCodeStr, min, max, sd, ed, pMode] = parts;
              const dateRange = sd && ed ? ` • ${sd} - ${ed}` : '';
              const airportDisplay = airportCodeStr ? ` • ${airportCodeStr}` : '';
              
              return (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cityName}{airportDisplay}</span>
                      <span className="text-sm text-muted-foreground">
                        ({min}-{max} km){dateRange}
                        <span className="ml-2 px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs uppercase">
                          {pMode === 'distance' ? 'Mesafe Bazlı' : 'Sabit'}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {group.map(r => (
                        <Button
                          key={r.id}
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(r)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {r.vehicle_type}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    {group.map(r => (
                      <div key={r.id} className="flex justify-between">
                        <span className="text-muted-foreground">{r.vehicle_type}:</span>
                        <span className="font-semibold">
                          {r.pricing_mode === 'distance' 
                            ? `€${r.extra_km_price}/km` 
                            : `€${r.base_price} (Sabit)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Kuralı Düzenle' : 'Yeni KM Fiyat Kuralı'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Şehir *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şehir Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Havalimanı Kodu (Opsiyonel)</Label>
                <Input
                  placeholder="örn: IST, AYT"
                  value={airportCode}
                  onChange={e => setAirportCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min KM *</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minKm}
                  onChange={e => setMinKm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max KM (boş = sınırsız)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="50"
                  value={maxKm}
                  onChange={e => setMaxKm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fiyatlandırma Modu</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer border p-2 rounded w-full justify-center has-[:checked]:bg-secondary">
                  <input
                    type="radio"
                    name="pricingMode"
                    value="fixed"
                    checked={pricingMode === 'fixed'}
                    onChange={() => setPricingMode('fixed')}
                    className="accent-primary"
                  />
                  <span>Sabit Fiyat (Base Price)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border p-2 rounded w-full justify-center has-[:checked]:bg-secondary">
                  <input
                    type="radio"
                    name="pricingMode"
                    value="distance"
                    checked={pricingMode === 'distance'}
                    onChange={() => setPricingMode('distance')}
                    className="accent-primary"
                  />
                  <span>Mesafe Bazlı (KM * Price)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Araç Fiyatları (€) *</Label>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPE_OPTIONS.map(v => (
                  <div key={v.value} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{v.label}</Label>
                    <MoneyInput
                      value={vehiclePrices[v.value]}
                      onValueChange={val => setVehiclePrices(prev => ({ ...prev, [v.value]: val }))}
                      placeholder={pricingMode === 'distance' ? "KM Başına €" : "Sabit Tutar €"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
