import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverTranslations } from '@/hooks/useDriverTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, User, Car, Phone, Mail, Palette, MapPin } from 'lucide-react';

const vehicleTypes = [
  { value: 'Mercedes Vito', label: 'Mercedes Vito' },
  { value: 'Mercedes VIP Vito', label: 'Mercedes VIP Vito' },
  { value: 'Maybach', label: 'Maybach' },
  { value: 'Minibus', label: 'Minibus' },
];

const regions = [
  { value: 'Istanbul', label: 'İstanbul' },
  { value: 'Antalya', label: 'Antalya' },
  { value: 'Bodrum', label: 'Bodrum' },
  { value: 'Dalaman', label: 'Dalaman' },
  { value: 'Izmir', label: 'İzmir' },
  { value: 'Cappadocia', label: 'Kapadokya' },
  { value: 'Bursa', label: 'Bursa' },
  { value: 'Dubai', label: 'Dubai' },
  { value: 'Cyprus', label: 'Kıbrıs' },
];

const vehicleColors = [
  { value: 'Siyah', label: 'Siyah' },
  { value: 'Beyaz', label: 'Beyaz' },
  { value: 'Gri', label: 'Gri' },
  { value: 'Gümüş', label: 'Gümüş' },
  { value: 'Lacivert', label: 'Lacivert' },
  { value: 'Mavi', label: 'Mavi' },
  { value: 'Kırmızı', label: 'Kırmızı' },
  { value: 'Bordo', label: 'Bordo' },
  { value: 'Kahverengi', label: 'Kahverengi' },
  { value: 'Bej', label: 'Bej' },
];

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  plate_number: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  region: string | null;
  user_id: string;
}

interface DriverInfoEditorProps {
  onClose?: () => void;
}

const DriverInfoEditor = ({ onClose }: DriverInfoEditorProps) => {
  const { driverId } = useUserRole();
  const { user } = useAuth();
  const { t } = useDriverTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    plate_number: '',
    vehicle_model: '',
    vehicle_color: '',
    region: '',
  });

  useEffect(() => {
    const fetchDriverInfo = async () => {
      if (!driverId) return;

      // Fetch driver info
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('Error fetching driver:', error);
        toast.error(t('failedToLoad'));
        return;
      }

      setDriverInfo(data);
      setFormData({
        phone: data.phone || '',
        plate_number: data.plate_number || '',
        vehicle_model: data.vehicle_model || '',
        vehicle_color: data.vehicle_color || '',
        region: data.region || '',
      });

      // Fetch user email
      if (user) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setEmail(userData.user.email);
        }
      }

      setLoading(false);
    };

    fetchDriverInfo();
  }, [driverId, user]);

  const handleSave = async () => {
    if (!driverId) return;
    
    setSaving(true);

    try {
      // Update driver info
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          phone: formData.phone,
          plate_number: formData.plate_number || null,
          vehicle_model: formData.vehicle_model || null,
          vehicle_color: formData.vehicle_color || null,
          region: formData.region || null,
        })
        .eq('id', driverId);

      if (driverError) throw driverError;

      // Update email if changed
      if (email && user) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email !== email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: email
          });
          if (emailError) {
            toast.error(t('emailUpdateFailed'));
          }
        }
      }

      toast.success(t('changesSaved'));
      onClose?.();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          {t('updateInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name (Read-only) */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-sm">{t('name')}</Label>
          <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-medium">
            {driverInfo?.name || '-'}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {t('phone')}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+90 5XX XXX XX XX"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {t('email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        {/* Region (Select from options) */}
        <div className="space-y-1.5">
          <Label htmlFor="region" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {t('region') || 'Bölge'}
          </Label>
          <Select
            value={formData.region || ''}
            onValueChange={(value) => setFormData({ ...formData, region: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectRegion') || 'Bölge seçin'} />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Model (Select from options) */}
        <div className="space-y-1.5">
          <Label htmlFor="vehicle" className="flex items-center gap-1.5">
            <Car className="h-4 w-4 text-muted-foreground" />
            {t('vehicleType')}
          </Label>
          <Select
            value={formData.vehicle_model || ''}
            onValueChange={(value) => setFormData({ ...formData, vehicle_model: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectVehicle')} />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plate Number */}
        <div className="space-y-1.5">
          <Label htmlFor="plate" className="flex items-center gap-1.5">
            <Car className="h-4 w-4 text-muted-foreground" />
            {t('plateNumber')}
          </Label>
          <Input
            id="plate"
            value={formData.plate_number}
            onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
            placeholder="34 ABC 123"
            className="font-mono"
          />
        </div>

        {/* Vehicle Color (Select from options) */}
        <div className="space-y-1.5">
          <Label htmlFor="color" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-muted-foreground" />
            {t('vehicleColor')}
          </Label>
          <Select
            value={formData.vehicle_color || ''}
            onValueChange={(value) => setFormData({ ...formData, vehicle_color: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('vehicleColorPlaceholder') || 'Renk seçin'} />
            </SelectTrigger>
            <SelectContent>
              {vehicleColors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full mt-4"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DriverInfoEditor;
