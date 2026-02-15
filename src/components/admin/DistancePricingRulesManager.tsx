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
import { Plus, Pencil, Trash2, MapPin, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';
import { GooglePlacesAutocomplete, type PlaceDetails } from '@/components/ui/google-places-autocomplete';
import { VEHICLE_TYPE_OPTIONS } from '@/lib/vehicleTypes';

// Backend ile uyumlu canonical vehicle_type değerleri
const VEHICLE_TO_CANONICAL: Record<string, string> = {
  'sedan': 'Standard Sedan',
  'mercedes-vito': 'Mercedes Vito or Similar',
  'vip-mercedes': 'Mercedes Maybach',
  'maybach-minibus': 'Mercedes Maybach',
  'minibus': 'Mercedes Sprinter or Similar',
};

export interface DistancePricingRule {
  id: string;
  vehicle_type: string | null;
  city: string | null;
  place_id: string | null;
  location_display: string | null;
  price_amount: number | null;
  base_price: number | null;
  price_per_km: number | null;
  min_km: number | null;
  max_km: number | null;
  is_airport_transfer: boolean;
  airport_extra_fee: number | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export default function DistancePricingRulesManager() {
  const [rules, setRules] = useState<DistancePricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DistancePricingRule | null>(null);
  const [editingGroup, setEditingGroup] = useState<DistancePricingRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [locationDisplay, setLocationDisplay] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [city, setCity] = useState('');
  const [minKm, setMinKm] = useState('');
  const [maxKm, setMaxKm] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isAirportTransfer, setIsAirportTransfer] = useState(true);
  const [airportBasePrice, setAirportBasePrice] = useState('');
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, string>>({
    'sedan': '',
    'mercedes-vito': '',
    'vip-mercedes': '',
    'maybach-minibus': '',
    'minibus': '',
  });

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('distance_pricing_rules')
        .select('id,vehicle_type,city,place_id,location_display,price_amount,base_price,price_per_km,min_km,max_km,is_airport_transfer,airport_extra_fee,valid_from,valid_to,created_at')
        .order('location_display', { ascending: true })
        .order('min_km', { ascending: true });

      if (error) throw error;
      setRules((data as DistancePricingRule[]) || []);
    } catch (err) {
      console.error('Error fetching distance pricing rules:', err);
      toast.error('Kurallar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handlePlaceSelected = (value: string, details?: PlaceDetails) => {
    setLocationDisplay(value);
    if (details) {
      setPlaceId(details.place_id || '');
      setCity(details.city || '');
    }
  };

  const resetForm = () => {
    setLocationDisplay('');
    setPlaceId('');
    setCity('');
    setMinKm('');
    setMaxKm('');
    setValidFrom('');
    setValidTo('');
    setIsAirportTransfer(true);
    setAirportBasePrice('');
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
    const groupKey = `${rule.location_display || rule.city || 'Genel'}|${rule.min_km ?? 0}|${rule.max_km ?? '-'}`;
    const group = rules.filter(r =>
      `${r.location_display || r.city || 'Genel'}|${r.min_km ?? 0}|${r.max_km ?? '-'}` === groupKey
    );
    setEditingGroup(group);
    setEditingRule(rule);
    setLocationDisplay(rule.location_display || '');
    setPlaceId(rule.place_id || '');
    setCity(rule.city || '');
    setMinKm(rule.min_km != null ? String(rule.min_km) : '');
    setMaxKm(rule.max_km != null ? String(rule.max_km) : '');
    setValidFrom(rule.valid_from || '');
    setValidTo(rule.valid_to || '');
    setIsAirportTransfer(rule.is_airport_transfer ?? true);
    setAirportBasePrice(rule.airport_extra_fee != null ? String(rule.airport_extra_fee) : '');
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
      if (key && r.price_amount != null) prices[key] = String(r.price_amount);
      else if (key && r.base_price != null) prices[key] = String(r.base_price);
    }
    setVehiclePrices(prices);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!locationDisplay.trim()) {
      toast.error('Lütfen şehir veya havalimanı seçin (Google Places)');
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
      const airportFee = parseFloat(airportBasePrice) || 0;
      const validFromDate = validFrom || null;
      const validToDate = validTo || null;
      const cityVal = city.trim() || null;

      if (editingRule && editingGroup.length > 0) {
        // Grup güncelleme - her araç için ayrı güncelle
        const revMap: Record<string, string> = {
          'Standard Sedan': 'sedan',
          'Mercedes Vito or Similar': 'mercedes-vito',
          'Mercedes Maybach': 'maybach-minibus',
          'Mercedes Sprinter or Similar': 'minibus',
        };
        const updatePayload = {
          location_display: locationDisplay.trim(),
          place_id: placeId || null,
          city: cityVal,
          min_km: min,
          max_km: max,
          valid_from: validFromDate,
          valid_to: validToDate,
          is_airport_transfer: isAirportTransfer,
          airport_extra_fee: airportFee,
          updated_at: new Date().toISOString(),
        };
        for (const r of editingGroup) {
          const canonical = (r.vehicle_type || '').trim();
          const key = revMap[canonical];
          const priceVal = key ? parseFloat(vehiclePrices[key] || '0') : 0;
          const { error } = await supabase
            .from('distance_pricing_rules')
            .update({ ...updatePayload, price_amount: priceVal })
            .eq('id', r.id);
          if (error) throw error;
        }
      } else {
        // Yeni kurallar: her araç için bir satır (canonical mapping ile birleştirilmiş)
        const toInsert: Array<{
          vehicle_type: string;
          city: string | null;
          place_id: string | null;
          location_display: string | null;
          price_amount: number;
          base_price: number;
          price_per_km: number;
          min_km: number;
          max_km: number | null;
          is_airport_transfer: boolean;
          airport_extra_fee: number;
          valid_from: string | null;
          valid_to: string | null;
        }> = [];

        const seenCanonical = new Set<string>();
        // Mercedes Maybach için önce maybach-minibus, yoksa vip-mercedes
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
          toInsert.push({
            vehicle_type: canonical,
            city: cityVal,
            place_id: placeId || null,
            location_display: locationDisplay.trim(),
            price_amount: p,
            base_price: p,
            price_per_km: 0,
            min_km: min,
            max_km: max,
            is_airport_transfer: isAirportTransfer,
            airport_extra_fee: airportFee,
            valid_from: validFromDate,
            valid_to: validToDate,
          });
        }

        if (toInsert.length === 0) {
          toast.error('En az bir araç için fiyat girin');
          setSaving(false);
          return;
        }

        const { error } = await supabase.from('distance_pricing_rules').insert(toInsert);
        if (error) throw error;
      }

      toast.success('KM fiyat kuralları kaydedildi');
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

  // Grupla: location_display + min_km + max_km
  const groupedRules = rules.reduce<Record<string, DistancePricingRule[]>>((acc, r) => {
    const key = `${r.location_display || r.city || 'Genel'}|${r.min_km ?? 0}|${r.max_km ?? '-'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          KM Bazlı Fiyat Kuralları
        </CardTitle>
        <CardDescription>
          Şehir veya havalimanını Google Places ile seçin, KM aralığı ve tüm araç fiyatlarını girin.
        </CardDescription>
        <Button size="sm" onClick={openNewDialog} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kural Ekle
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
        ) : rules.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Henüz kural yok. Yeni kural ekleyerek başlayın.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([key, group]) => {
              const [loc, min, max] = key.split('|');
              const first = group[0];
              return (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{loc}</span>
                      <span className="text-sm text-muted-foreground">
                        ({min}-{max} km)
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
                        <span>€{r.price_amount ?? (r.base_price != null && r.price_per_km != null ? `${r.base_price}+${r.price_per_km}/km` : '-')}</span>
                      </div>
                    ))}
                    {first?.airport_extra_fee != null && Number(first.airport_extra_fee) > 0 && (
                      <div className="col-span-full text-xs text-muted-foreground">
                        Havalimanı baz: +€{first.airport_extra_fee}
                      </div>
                    )}
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
            <div className="space-y-2">
              <Label>Şehir / Havalimanı (Google Places) *</Label>
              <GooglePlacesAutocomplete
                placeholder="Şehir veya havalimanı ara... (örn: İstanbul Havalimanı, Antalya)"
                onPlaceSelected={handlePlaceSelected}
                initialValue={locationDisplay}
              />
              {city && <p className="text-xs text-muted-foreground">Tespit edilen şehir: {city}</p>}
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
                <Label>Geçerlilik Başlangıç (opsiyonel)</Label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Geçerlilik Bitiş (opsiyonel)</Label>
                <Input
                  type="date"
                  value={validTo}
                  onChange={e => setValidTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAirport"
                checked={isAirportTransfer}
                onChange={e => setIsAirportTransfer(e.target.checked)}
              />
              <Label htmlFor="isAirport">Havalimanı transferi</Label>
            </div>

            <div className="space-y-2">
              <Label>Havalimanı Baz Fiyat (€) – Transfer tutarına eklenecek</Label>
              <MoneyInput
                value={airportBasePrice}
                onValueChange={setAirportBasePrice}
                placeholder="0"
              />
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
                      placeholder="0"
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
