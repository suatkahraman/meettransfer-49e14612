import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Plane, Car, CreditCard, CheckCircle, Save, Loader2, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  price: number;
  status: string;
  driver_confirmed: boolean;
  driver_earning: number | null;
  driver_cash_amount: number | null;
  driver_notes: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-500/20 text-gray-700',
  assigned: 'bg-yellow-500/20 text-yellow-700',
  active: 'bg-blue-500/20 text-blue-700',
  completed: 'bg-green-500/20 text-green-700',
};

const DriverJobDetails = () => {
  const { id } = useParams();
  const { user, signOut } = useAuth();
  const { driverId } = useUserRole();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number>(70);
  
  // Driver editable fields
  const [driverEarning, setDriverEarning] = useState('');
  const [driverCashAmount, setDriverCashAmount] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [savingFinancials, setSavingFinancials] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch reservation
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (resError) {
        console.error('Error:', resError);
        toast.error('Failed to load job details');
        setLoading(false);
        return;
      }
      
      if (resData) {
        setReservation(resData);
        setDriverCashAmount(resData.driver_cash_amount?.toString() || '');
        setDriverNotes(resData.driver_notes || '');

        // Fetch driver's commission rate
        if (driverId) {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('commission_rate')
            .eq('id', driverId)
            .maybeSingle();
          
          const rate = driverData?.commission_rate ? Number(driverData.commission_rate) : 70;
          setCommissionRate(rate);
          
          // Auto-calculate earning if not already set
          if (resData.driver_earning !== null) {
            setDriverEarning(resData.driver_earning.toString());
          } else if (resData.price) {
            const autoEarning = (resData.price * rate / 100).toFixed(2);
            setDriverEarning(autoEarning);
          }
        } else {
          setDriverEarning(resData.driver_earning?.toString() || '');
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [id, driverId]);

  const confirmJob = async () => {
    if (!id) return;
    setUpdating(true);

    const { error } = await supabase
      .from('reservations')
      .update({ 
        driver_confirmed: true,
        status: 'active'
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to confirm job');
    } else {
      toast.success('Job confirmed successfully!');
      setReservation(prev => prev ? { ...prev, driver_confirmed: true, status: 'active' } : null);
    }
    setUpdating(false);
  };

  const saveFinancials = async () => {
    if (!id) return;
    setSavingFinancials(true);

    const { error } = await supabase
      .from('reservations')
      .update({
        driver_earning: driverEarning ? parseFloat(driverEarning) : null,
        driver_cash_amount: driverCashAmount ? parseFloat(driverCashAmount) : null,
        driver_notes: driverNotes || null
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to save financial data');
    } else {
      toast.success('Driver financial data saved!');
      setReservation(prev => prev ? {
        ...prev,
        driver_earning: driverEarning ? parseFloat(driverEarning) : null,
        driver_cash_amount: driverCashAmount ? parseFloat(driverCashAmount) : null,
        driver_notes: driverNotes || null
      } : null);
    }
    setSavingFinancials(false);
  };

  const updateStatus = async (newStatus: string, driverCash?: boolean) => {
    if (!id) return;
    setUpdating(true);

    const updateData: any = { status: newStatus };
    if (driverCash !== undefined) {
      updateData.driver_cash = driverCash;
    }

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setReservation(prev => prev ? { ...prev, status: newStatus } : null);
      setShowCashDialog(false);
    }
    setUpdating(false);
  };

  const handleComplete = () => {
    if (reservation?.payment_type === 'cash') {
      setShowCashDialog(true);
    } else {
      updateStatus('completed', false);
    }
  };

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
        <p>Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif">Job Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Badge className={statusColors[reservation.status]}>
            {reservation.status}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl space-y-6">
        {/* Job Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(new Date(reservation.pickup_date), 'PPPP')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{reservation.pickup_time}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{reservation.customer_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <a href={`tel:${reservation.customer_phone}`} className="font-medium text-primary">
                    {reservation.customer_phone}
                  </a>
                </div>
              </div>

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

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Payment</div>
                  <div className="font-medium capitalize">{reservation.payment_type}</div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Price</span>
                <span className="text-2xl font-bold text-primary">€{reservation.price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Financial Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Driver Financial Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver_earning">Your Earning (Budget)</Label>
              <Input
                id="driver_earning"
                type="number"
                step="0.01"
                placeholder="e.g., 70"
                value={driverEarning}
                onChange={(e) => setDriverEarning(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated: €{reservation?.price} × {commissionRate}% = €{((reservation?.price || 0) * commissionRate / 100).toFixed(2)} (editable)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_cash">Cash Collected from Passenger</Label>
              <Input
                id="driver_cash"
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                value={driverCashAmount}
                onChange={(e) => setDriverCashAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_notes">Notes / Additional Info</Label>
              <Textarea
                id="driver_notes"
                placeholder="Delays, extra stops, special situations..."
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={saveFinancials} 
              disabled={savingFinancials}
              className="w-full"
            >
              {savingFinancials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Cash & Budget
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons Card */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {reservation.status === 'assigned' && !reservation.driver_confirmed && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={confirmJob}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Confirm Job
              </Button>
            )}

            {(reservation.status === 'assigned' && reservation.driver_confirmed) && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => updateStatus('active')}
                disabled={updating}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Passenger Picked Up
              </Button>
            )}
            
            {reservation.status === 'active' && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleComplete}
                disabled={updating}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Trip Completed
              </Button>
            )}

            {reservation.status === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-600">Trip Completed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cash Collection Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cash Collection</DialogTitle>
          </DialogHeader>
          <p className="py-4">Did you collect cash payment of €{reservation.price} from the customer?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => updateStatus('completed', false)} disabled={updating}>
              No, Not Collected
            </Button>
            <Button onClick={() => updateStatus('completed', true)} disabled={updating}>
              Yes, Collected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverJobDetails;
