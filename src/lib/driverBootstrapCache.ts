import { supabase } from '@/integrations/supabase/client';

type BootstrapReservation = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  flight_number: string | null;
  vehicle_type: string;
  payment_type: string;
  payment_status: string | null;
  price: number | null;
  price_currency: string | null;
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  driver_cash_amount: number | null;
  reservation_code: string | null;
  status: string;
  driver_confirmed: boolean | null;
  agency_id: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
  pickup_place_name: string | null;
  dropoff_place_name: string | null;
};

type DriverBootstrapCachePayload = {
  userId: string;
  driverId: string;
  reservations: BootstrapReservation[];
  adminNotesMap: Record<string, string>;
  expiresAt: number;
};

const DRIVER_BOOTSTRAP_CACHE_KEY = 'mt_driver_bootstrap_cache_v1';
const DRIVER_BOOTSTRAP_TTL_MS = 3 * 60 * 1000;
// Lean select for bootstrap - no agencies join
const BOOTSTRAP_RESERVATION_SELECT = `
  id,
  customer_id,
  customer_name,
  customer_phone,
  pickup,
  dropoff,
  pickup_date,
  pickup_time,
  flight_number,
  vehicle_type,
  payment_type,
  payment_status,
  price,
  price_currency,
  passenger_cash_amount,
  passenger_cash_currency,
  driver_cash_amount,
  reservation_code,
  status,
  driver_confirmed,
  agency_id,
  luggage_count,
  baby_seat_count,
  pickup_place_name,
  dropoff_place_name
`;
const BOOTSTRAP_ACTIONABLE_LIMIT = 20;
const BOOTSTRAP_COMPLETED_LIMIT = 10;

const sortByPickupDateTime = (items: BootstrapReservation[]) =>
  [...items].sort((a, b) => {
    const dateTimeA = new Date(`${a.pickup_date}T${a.pickup_time}`);
    const dateTimeB = new Date(`${b.pickup_date}T${b.pickup_time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

export const writeDriverBootstrapCache = (payload: {
  userId: string;
  driverId: string;
  reservations: BootstrapReservation[];
  adminNotesMap: Record<string, string>;
}) => {
  try {
    const cacheData: DriverBootstrapCachePayload = {
      userId: payload.userId,
      driverId: payload.driverId,
      reservations: payload.reservations,
      adminNotesMap: payload.adminNotesMap,
      expiresAt: Date.now() + DRIVER_BOOTSTRAP_TTL_MS,
    };
    localStorage.setItem(DRIVER_BOOTSTRAP_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Storage can be unavailable in private mode / iOS contexts.
  }
};

export const readDriverBootstrapCache = (
  userId: string,
  driverId: string
): { reservations: BootstrapReservation[]; adminNotesMap: Record<string, string> } | null => {
  try {
    const raw = localStorage.getItem(DRIVER_BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DriverBootstrapCachePayload>;
    if (parsed.userId !== userId || parsed.driverId !== driverId) return null;
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
      localStorage.removeItem(DRIVER_BOOTSTRAP_CACHE_KEY);
      return null;
    }
    if (!Array.isArray(parsed.reservations)) return null;

    return {
      reservations: parsed.reservations as BootstrapReservation[],
      adminNotesMap: typeof parsed.adminNotesMap === 'object' && parsed.adminNotesMap
        ? (parsed.adminNotesMap as Record<string, string>)
        : {},
    };
  } catch {
    return null;
  }
};

export const prefetchDriverBootstrap = async (userId: string, driverId: string | null) => {
  if (!userId || !driverId) return;

  try {
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [actionableQuery, completedQuery] = await Promise.all([
      supabase
        .from('reservations')
        .select(BOOTSTRAP_RESERVATION_SELECT)
        .eq('driver_id', driverId)
        .in('status', ['pending', 'pending_admin_review', 'sent_to_driver', 'assigned', 'confirmed', 'active'])
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .limit(BOOTSTRAP_ACTIONABLE_LIMIT),
      supabase
        .from('reservations')
        .select(BOOTSTRAP_RESERVATION_SELECT)
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('pickup_date', firstDayOfCurrentMonth)
        .lte('pickup_date', lastDayOfCurrentMonth)
        .order('pickup_date', { ascending: false })
        .order('pickup_time', { ascending: false })
        .limit(BOOTSTRAP_COMPLETED_LIMIT),
    ]);

    if (actionableQuery.error || completedQuery.error) return;

    const reservations = sortByPickupDateTime([
      ...((actionableQuery.data || []) as BootstrapReservation[]),
      ...((completedQuery.data || []) as BootstrapReservation[]),
    ]);

    // Admin notes deferred to job details view - speeds up login bootstrap
    writeDriverBootstrapCache({
      userId,
      driverId,
      reservations,
      adminNotesMap: {},
    });
  } catch {
    // Prefetch should never block login flow.
  }
};
