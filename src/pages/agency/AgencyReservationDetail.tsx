import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Users, Phone, Plane, Car, Loader2, Save, Edit, Copy, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Driver {
  id: string;
  name: string;
  plate_number: string | null;
  vehicle_model: string | null;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  status: string;
  passenger_names: string[] | null;
  driver_id: string | null;
  drivers?: Driver | null;
}

interface AgencyReservationDetail {
  id: string;
  reservation_id: string;
  customer_price: number;
  company_amount: number;
  agency_profit: number;
  agency_notes: string | null;
  payment_status: string;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-gray-500/20 text-gray-700',
  'confirmed': 'bg-green-500/20 text-green-700',
  'sent_to_driver': 'bg-purple-500/20 text-purple-700',
  'assigned': 'bg-purple-500/20 text-purple-700',
  'active': 'bg-blue-500/20 text-blue-700',
  'completed': 'bg-green-500/20 text-green-700',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Pending Price',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'assigned': 'Assigned',
  'active': 'Active',
  'completed': 'Completed',
};

const paymentStatusLabels: Record<string, string> = {
  'not_paid': 'Not Paid',
  'partially_paid': 'Partially Paid',
  'paid': 'Paid',
};

const AgencyReservationDetail = () => {
  const { id } = useParams();
  const { agencyId } = useUserRole();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [agencyDetails, setAgencyDetails] = useState<AgencyReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [customerPrice, setCustomerPrice] = useState('');
  const [companyAmount, setCompanyAmount] = useState('');
  const [agencyNotes, setAgencyNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('not_paid');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch reservation with driver info
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select(`
          id, reservation_code, customer_name, customer_phone, pickup, dropoff,
          pickup_date, pickup_time, flight_number, vehicle_type, status,
          passenger_names, driver_id,
          drivers:driver_id (id, name, plate_number, vehicle_model)
        `)
        .eq('id', id)
        .single();

      if (resError) {
        console.error('Error:', resError);
        toast.error('Failed to load reservation');
        setLoading(false);
        return;
      }

      setReservation(resData);

      // Fetch agency-specific details
      const { data: detailData } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .eq('reservation_id', id)
        .maybeSingle();

      if (detailData) {
        setAgencyDetails(detailData);
        setCustomerPrice(detailData.customer_price?.toString() || '0');
        setCompanyAmount(detailData.company_amount?.toString() || '0');
        setAgencyNotes(detailData.agency_notes || '');
        setPaymentStatus(detailData.payment_status || 'not_paid');
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!id || !agencyId) return;
    setSaving(true);

    const detailsData = {
      reservation_id: id,
      customer_price: parseFloat(customerPrice) || 0,
      company_amount: parseFloat(companyAmount) || 0,
      agency_notes: agencyNotes || null,
      payment_status: paymentStatus,
    };

    try {
      if (agencyDetails) {
        // Update existing
        const { error } = await supabase
          .from('agency_reservation_details')
          .update(detailsData)
          .eq('id', agencyDetails.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('agency_reservation_details')
          .insert(detailsData);

        if (error) throw error;
      }

      toast.success('Changes saved successfully');
      setIsEditing(false);

      // Refresh data
      const { data } = await supabase
        .from('agency_reservation_details')
        .select('*')
        .eq('reservation_id', id)
        .maybeSingle();

      if (data) {
        setAgencyDetails(data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDetails = () => {
    if (!reservation) return;

    const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name, i) => `${i + 1}. ${name}`).join('\n')
      : reservation.customer_name;

    const details = [
      `Reservation: ${reservation.reservation_code || 'N/A'}`,
      `Date: ${format(new Date(reservation.pickup_date), 'dd/MM/yyyy')}`,
      `Time: ${reservation.pickup_time}`,
      '',
      'Passengers:',
      passengerList,
      '',
      `Pickup: ${reservation.pickup}`,
      `Drop-off: ${reservation.dropoff}`,
      reservation.flight_number ? `Flight: ${reservation.flight_number}` : null,
      `Vehicle: ${reservation.vehicle_type.replace('-', ' ')}`,
      '',
      `Price: ₺${agencyDetails?.customer_price || 0}`,
      '',
      reservation.drivers ? `Driver: ${reservation.drivers.name}` : null,
      reservation.drivers?.plate_number ? `Plate: ${reservation.drivers.plate_number}` : null,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details);
    toast.success('Reservation details copied');
  };

  const calculatedProfit = (parseFloat(customerPrice) || 0) - (parseFloat(companyAmount) || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Reservation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agency')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-serif">Reservation Details</h1>
        </div>
        <Badge className={statusColors[reservation.status] || 'bg-muted'}>
          {statusLabels[reservation.status] || reservation.status}
        </Badge>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-2xl space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              {reservation.reservation_code && (
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {reservation.reservation_code}
                </span>
              )}
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(reservation.pickup_date), 'PPPP')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{reservation.pickup_time}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
              </div>

              {reservation.passenger_names && reservation.passenger_names.length > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      All Passengers ({reservation.passenger_names.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {reservation.passenger_names.map((name, index) => (
                        <div key={index} className="text-sm">{index + 1}. {name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Pickup</div>
                  <div className="font-medium">{reservation.pickup}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Drop-off</div>
                  <div className="font-medium">{reservation.dropoff}</div>
                </div>
              </div>

              {reservation.flight_number && (
                <div className="flex items-start gap-3">
                  <Plane className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Flight</div>
                    <div className="font-medium">{reservation.flight_number}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Vehicle</div>
                  <div className="font-medium capitalize">{reservation.vehicle_type.replace('-', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {reservation.drivers && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Assigned Driver</h3>
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <p className="font-medium">{reservation.drivers.name}</p>
                  {reservation.drivers.vehicle_model && (
                    <p className="text-sm text-muted-foreground">{reservation.drivers.vehicle_model}</p>
                  )}
                  {reservation.drivers.plate_number && (
                    <p className="text-sm font-mono">{reservation.drivers.plate_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Copy & Share Buttons */}
            <div className="pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCopyDetails}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Reservation Details
              </Button>
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white"
                onClick={() => {
                  if (!reservation) return;
                  const passengerList = reservation.passenger_names && reservation.passenger_names.length > 0
                    ? reservation.passenger_names.map((name, i) => `${i + 1}. ${name}`).join('\n')
                    : reservation.customer_name;
                  const details = [
                    `Reservation: ${reservation.reservation_code || 'N/A'}`,
                    `Date: ${format(new Date(reservation.pickup_date), 'dd/MM/yyyy')}`,
                    `Time: ${reservation.pickup_time}`,
                    '',
                    'Passengers:',
                    passengerList,
                    '',
                    `Pickup: ${reservation.pickup}`,
                    `Drop-off: ${reservation.dropoff}`,
                    reservation.flight_number ? `Flight: ${reservation.flight_number}` : null,
                    `Vehicle: ${reservation.vehicle_type.replace('-', ' ')}`,
                    '',
                    `Price: ₺${agencyDetails?.customer_price || 0}`,
                    '',
                    reservation.drivers ? `Driver: ${reservation.drivers.name}` : null,
                    reservation.drivers?.plate_number ? `Plate: ${reservation.drivers.plate_number}` : null,
                  ].filter(Boolean).join('\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent(details)}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agency Pricing Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Agency Pricing & Notes</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Price (₺)</Label>
                    <Input
                      type="number"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Amount (₺)</Label>
                    <Input
                      type="number"
                      value={companyAmount}
                      onChange={(e) => setCompanyAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agency Profit:</span>
                    <span className={`font-bold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₺{calculatedProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_paid">Not Paid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agency Notes (Private)</Label>
                  <Textarea
                    value={agencyNotes}
                    onChange={(e) => setAgencyNotes(e.target.value)}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Customer Price</div>
                    <div className="text-xl font-bold">₺{agencyDetails?.customer_price || 0}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Company Amount</div>
                    <div className="text-xl font-bold">₺{agencyDetails?.company_amount || 0}</div>
                  </div>
                </div>

                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Agency Profit:</span>
                    <span className={`text-xl font-bold ${(agencyDetails?.agency_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₺{agencyDetails?.agency_profit || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {paymentStatusLabels[agencyDetails?.payment_status || 'not_paid']}
                  </Badge>
                </div>

                {agencyDetails?.agency_notes && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Notes</div>
                    <p>{agencyDetails.agency_notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgencyReservationDetail;
