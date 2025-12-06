import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Plane, Car, CreditCard, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

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
}

const statusColors: Record<string, string> = {
  assigned: 'bg-yellow-500/20 text-yellow-700',
  active: 'bg-blue-500/20 text-blue-700',
  completed: 'bg-green-500/20 text-green-700',
};

const DriverJobDetails = () => {
  const { id } = useParams();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error:', error);
        toast.error('Failed to load job details');
      } else {
        setReservation(data);
      }
      setLoading(false);
    };

    fetchReservation();
  }, [id]);

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
        <p>Loading...</p>
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
        <Badge className={statusColors[reservation.status]}>
          {reservation.status}
        </Badge>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-2xl">
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
                <span className="text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">€{reservation.price}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {reservation.status === 'assigned' && (
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
            </div>
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
