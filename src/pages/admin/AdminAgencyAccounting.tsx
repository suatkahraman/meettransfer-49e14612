import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Calendar, MapPin, Car, User, DollarSign, Clock, Plane, Users } from 'lucide-react';
import { MonthNavigator } from '@/components/accounting/MonthNavigator';
import { MonthlySummaryCard } from '@/components/accounting/MonthlySummaryCard';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface Agency {
  id: string;
  agency_name: string;
  comments: string | null;
}

interface Driver {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  reservation_code: string | null;
  pickup_date: string;
  pickup_time: string;
  pickup: string;
  dropoff: string;
  price: number | null;
  price_currency: string | null;
  driver_cash_amount: number | null;
  status: string;
  customer_name: string;
  driver_id: string | null;
  vehicle_type: string;
  passenger_names: string[] | null;
  flight_number: string | null;
  driver_notes: string | null;
}

const statusColors: Record<string, string> = {
  'pending_price': 'bg-orange-500/20 text-orange-700',
  'waiting_for_customer_approval': 'bg-purple-500/20 text-purple-700',
  'customer_approved': 'bg-blue-500/20 text-blue-700',
  'customer_rejected': 'bg-destructive/20 text-destructive',
  'confirmed': 'bg-emerald-500/20 text-emerald-700',
  'sent_to_driver': 'bg-yellow-500/20 text-yellow-700',
  'active': 'bg-cyan-500/20 text-cyan-700',
  'completed': 'bg-green-500/20 text-green-700',
};

const statusLabels: Record<string, string> = {
  'pending_price': 'Pending Price',
  'waiting_for_customer_approval': 'Awaiting Approval',
  'customer_approved': 'Approved',
  'customer_rejected': 'Rejected',
  'confirmed': 'Confirmed',
  'sent_to_driver': 'Sent to Driver',
  'active': 'Active',
  'completed': 'Completed',
};

const currencies: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const AdminAgencyAccounting = () => {
  const navigate = useNavigate();
  const { agencyId } = useParams();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all agencies and drivers
  useEffect(() => {
    const fetchBaseData = async () => {
      const [agenciesRes, driversRes] = await Promise.all([
        supabase.from('agencies').select('*').order('agency_name'),
        supabase.from('drivers').select('id, name'),
      ]);
      setAllAgencies(agenciesRes.data || []);
      setDrivers(driversRes.data || []);
    };
    fetchBaseData();
  }, []);

  // Fetch current agency
  useEffect(() => {
    if (agencyId && allAgencies.length > 0) {
      const found = allAgencies.find(a => a.id === agencyId);
      setAgency(found || null);
    }
  }, [agencyId, allAgencies]);

  // Fetch reservations for selected agency and month
  useEffect(() => {
    const fetchReservations = async () => {
      if (!agencyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      let query = supabase
        .from('reservations')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('pickup_date', monthStart)
        .lte('pickup_date', monthEnd)
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data } = await query;
      setReservations(data || []);
      setLoading(false);
    };

    fetchReservations();

    // Real-time subscription
    const channel = supabase
      .channel('agency-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, currentMonth, selectedStatus]);

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Not Assigned';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Unknown';
  };

  const getCurrencySymbol = (currency: string | null) => currencies[currency || 'TRY'] || currency;

  const totalPrice = reservations.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCash = reservations.reduce((sum, r) => sum + (r.driver_cash_amount || 0), 0);

  const handleAgencyChange = (newAgencyId: string) => {
    navigate(`/admin/agency-accounting/${newAgencyId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center gap-4 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/admin/agencies')} 
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-serif">Agency Accounting</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 space-y-6">
          {/* Agency Selector */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Select value={agencyId || ''} onValueChange={handleAgencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agency" />
                </SelectTrigger>
                <SelectContent>
                  {allAgencies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {agency?.comments && (
              <p className="text-sm text-muted-foreground italic">{agency.comments}</p>
            )}
          </div>

          {!agencyId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select an agency to view accounting</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Month Navigator */}
              <MonthNavigator
                currentMonth={currentMonth}
                onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
              />

              {/* Status Filter */}
              <div className="flex gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="sent_to_driver">Sent to Driver</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <>
                  {/* Monthly Summary */}
                  <MonthlySummaryCard
                    totalTransfers={reservations.length}
                    totalPrice={totalPrice}
                    totalCashCollected={totalCash}
                  />

                  {/* Reservations List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Reservations ({reservations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reservations.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          No reservations found for this period
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reservations.map((res) => {
                            const symbol = getCurrencySymbol(res.price_currency);
                            const passengerCount = res.passenger_names?.length || 1;

                            return (
                              <Card 
                                key={res.id} 
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/admin/reservations/${res.id}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex flex-wrap justify-between items-start gap-4">
                                    {/* Left - Details */}
                                    <div className="space-y-2 flex-1 min-w-[200px]">
                                      <div className="flex items-center gap-2">
                                        {res.reservation_code && (
                                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                            {res.reservation_code}
                                          </span>
                                        )}
                                        <Badge className={statusColors[res.status] || 'bg-muted'}>
                                          {statusLabels[res.status] || res.status}
                                        </Badge>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{format(new Date(res.pickup_date), 'dd MMM yyyy')}</span>
                                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                                        <span>{res.pickup_time}</span>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">
                                          {res.pickup} → {res.dropoff}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Car className="h-4 w-4" />
                                          {res.vehicle_type.replace('-', ' ')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Users className="h-4 w-4" />
                                          {passengerCount} pax
                                        </span>
                                        {res.flight_number && (
                                          <span className="flex items-center gap-1">
                                            <Plane className="h-4 w-4" />
                                            {res.flight_number}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>Driver: {getDriverName(res.driver_id)}</span>
                                      </div>
                                    </div>

                                    {/* Right - Pricing */}
                                    <div className="text-right space-y-1">
                                      <div className="flex items-center justify-end gap-1 text-lg font-semibold">
                                        <DollarSign className="h-4 w-4" />
                                        {symbol}{res.price?.toFixed(2) || '0.00'}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Cash: {symbol}{res.driver_cash_amount?.toFixed(2) || '0.00'}
                                      </div>
                                    </div>
                                  </div>

                                  {res.driver_notes && (
                                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                      Notes: {res.driver_notes}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAgencyAccounting;
