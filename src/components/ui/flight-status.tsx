import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Plane, AlertTriangle, PlaneLanding, PlaneTakeoff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface FlightStatusData {
  found: boolean;
  flightNumber?: string;
  airline?: string;
  status?: string;
  date?: string;
  message?: string;
  departure?: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    delay: number | null;
  };
  arrival?: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    delay: number | null;
  };
}

interface FlightStatusProps {
  flightNumber: string | null | undefined;
  date?: string;
  className?: string;
  compact?: boolean;
  reservationId?: string;
  onStatusChange?: (status: FlightStatusData) => void;
  onArrivalTimeChange?: (time: string) => void;
  /** default: 5 minutes */
  refreshIntervalMs?: number;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-700',
  active: 'bg-green-500/20 text-green-700',
  landed: 'bg-emerald-500/20 text-emerald-700',
  cancelled: 'bg-destructive/20 text-destructive',
  diverted: 'bg-orange-500/20 text-orange-700',
  delayed: 'bg-amber-500/20 text-amber-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  scheduled: <Clock className="h-3 w-3" />,
  active: <Plane className="h-3 w-3" />,
  landed: <PlaneLanding className="h-3 w-3" />,
  cancelled: <AlertTriangle className="h-3 w-3" />,
  diverted: <AlertTriangle className="h-3 w-3" />,
  delayed: <Clock className="h-3 w-3" />,
};

const formatTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '--:--';
  try {
    return format(parseISO(isoString), 'HH:mm');
  } catch {
    return '--:--';
  }
};

/**
 * Extract arrival time from flight data (actual > estimated > scheduled)
 */
const extractArrivalTime = (flightData: FlightStatusData): string | null => {
  if (!flightData?.found || !flightData?.arrival) return null;
  
  const arrival = flightData.arrival;
  const arrivalTimeStr = arrival.actual || arrival.estimated || arrival.scheduled;
  
  if (!arrivalTimeStr) return null;
  
  try {
    const date = new Date(arrivalTimeStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return null;
  }
};

export const FlightStatus = ({
  flightNumber,
  date,
  className,
  compact = false,
  reservationId,
  onStatusChange,
  onArrivalTimeChange,
  refreshIntervalMs = 5 * 60 * 1000,
}: FlightStatusProps) => {
  const [status, setStatus] = useState<FlightStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const lastNotifiedRef = useRef<{ delay: number | null; status: string | null; arrivalTime: string | null }>({ 
    delay: null, 
    status: null, 
    arrivalTime: null 
  });
  const onStatusChangeRef = useRef(onStatusChange);
  const onArrivalTimeChangeRef = useRef(onArrivalTimeChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onArrivalTimeChangeRef.current = onArrivalTimeChange;
  }, [onStatusChange, onArrivalTimeChange]);

  const notifyDriver = useCallback(
    async (flightData: FlightStatusData, extractedArrivalTime: string | null) => {
      if (!reservationId || !flightData.found) return;

      const currentDelay = flightData.arrival?.delay || 0;
      const currentStatus = flightData.status?.toLowerCase() || '';
      const oldArrivalTime = lastNotifiedRef.current.arrivalTime;

      // Check for significant changes
      const delayChanged =
        lastNotifiedRef.current.delay !== null &&
        Math.abs(currentDelay - lastNotifiedRef.current.delay) >= 15;

      const statusChanged =
        lastNotifiedRef.current.status !== null &&
        lastNotifiedRef.current.status !== currentStatus &&
        ['cancelled', 'landed', 'diverted'].includes(currentStatus);

      const arrivalTimeChanged =
        extractedArrivalTime !== null &&
        oldArrivalTime !== null &&
        oldArrivalTime !== extractedArrivalTime;

      if (delayChanged || statusChanged || arrivalTimeChanged) {
        console.log('[FlightStatus] Significant change detected, notifying driver');
        console.log(`[FlightStatus] Old arrival: ${oldArrivalTime}, New arrival: ${extractedArrivalTime}`);
        
        try {
          await supabase.functions.invoke('notify-flight-delay', {
            body: {
              reservation_id: reservationId,
              flight_number: flightData.flightNumber,
              delay_minutes: currentDelay,
              status: currentStatus,
              arrival_time: extractedArrivalTime,
              old_arrival_time: oldArrivalTime,
            },
          });
          console.log('[FlightStatus] Driver notification sent');
        } catch (err) {
          console.error('[FlightStatus] Failed to notify driver:', err);
        }
      }

      lastNotifiedRef.current = { 
        delay: currentDelay, 
        status: currentStatus, 
        arrivalTime: extractedArrivalTime 
      };
    },
    [reservationId]
  );

  const updateReservationFlightData = useCallback(async (
    flightData: FlightStatusData,
    arrivalTime: string | null
  ) => {
    if (!reservationId || !flightData.found) return;

    console.log(`[FlightStatus] Updating reservation ${reservationId} with arrival time: ${arrivalTime}`);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          flight_arrival_time: arrivalTime,
          flight_status: flightData.status?.toLowerCase() || null,
          flight_last_checked: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (error) {
        console.error('[FlightStatus] Failed to update reservation:', error);
      } else {
        console.log('[FlightStatus] Reservation updated successfully');
        // Callback for UI update
        if (arrivalTime) {
          onArrivalTimeChangeRef.current?.(arrivalTime);
        }
      }
    } catch (err) {
      console.error('[FlightStatus] Error updating reservation:', err);
    }
  }, [reservationId]);

  const fetchStatus = useCallback(async () => {
    if (!flightNumber || flightNumber.trim().length < 3) {
      setStatus(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[FlightStatus] Fetching status for ${flightNumber}`);
      
      const { data, error: invokeError } = await supabase.functions.invoke('flight-status', {
        body: { flightNumber: flightNumber.trim(), date },
      });

      if (invokeError) {
        console.error('[FlightStatus] API error:', invokeError);
        setError('Unable to fetch flight status');
        setStatus(null);
        return;
      }

      setStatus(data);
      setLastRefresh(new Date());

      if (data?.found) {
        const arrivalTime = extractArrivalTime(data);
        console.log(`[FlightStatus] Extracted arrival time: ${arrivalTime}`);
        
        // Update reservation with flight data
        await updateReservationFlightData(data, arrivalTime);
        
        // Notify driver if significant change
        await notifyDriver(data, arrivalTime);
        
        // General status change callback
        onStatusChangeRef.current?.(data);
      }
    } catch (err) {
      console.error('[FlightStatus] Fetch error:', err);
      setError('Unable to fetch flight status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [flightNumber, date, notifyDriver, updateReservationFlightData]);

  useEffect(() => {
    // first fetch (debounced a bit)
    const t = setTimeout(() => {
      fetchStatus();
    }, 600);

    return () => clearTimeout(t);
  }, [fetchStatus]);

  useEffect(() => {
    // periodic refresh (prevents constant re-fetch loop; also gives "real-time" feel)
    if (!flightNumber || flightNumber.trim().length < 3) return;
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;

    const id = window.setInterval(() => {
      console.log('[FlightStatus] Auto-refreshing flight status');
      fetchStatus();
    }, refreshIntervalMs);

    return () => window.clearInterval(id);
  }, [flightNumber, refreshIntervalMs, fetchStatus]);

  if (!flightNumber || flightNumber.trim().length < 3) return null;
  if (loading && !status) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Uçuş durumu kontrol ediliyor...</span>
      </div>
    );
  }

  if (error || !status || !status.found) return null;

  const flightStatus = status.status?.toLowerCase() || 'scheduled';
  const hasDelay =
    (status.departure?.delay && status.departure.delay > 0) ||
    (status.arrival?.delay && status.arrival.delay > 0);

  const arrivalTime = extractArrivalTime(status);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge className={cn('text-xs', statusColors[flightStatus] || statusColors.scheduled)}>
          {statusIcons[flightStatus] || <Plane className="h-3 w-3" />}
          <span className="ml-1 capitalize">{status.status || 'Scheduled'}</span>
        </Badge>
        {hasDelay && status.arrival?.delay ? (
          <span className="text-xs text-amber-600">+{status.arrival.delay} dk gecikme</span>
        ) : null}
        {arrivalTime && (
          <span className="text-xs text-muted-foreground">Varış: {arrivalTime}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-3 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Badge className={cn('text-xs', statusColors[flightStatus] || statusColors.scheduled)}>
          {statusIcons[flightStatus] || <Plane className="h-3 w-3" />}
          <span className="ml-1 capitalize">{status.status || 'Scheduled'}</span>
        </Badge>
        <div className="flex items-center gap-2">
          {hasDelay ? (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Gecikme
            </Badge>
          ) : null}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <PlaneTakeoff className="h-3 w-3" />
            <span className="text-xs">Kalkış</span>
          </div>
          <div className="font-bold text-lg">{status.departure?.iata || '--'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
            {status.departure?.airport || 'Unknown'}
          </div>
          <div className="font-medium">
            {formatTime(status.departure?.actual || status.departure?.estimated || status.departure?.scheduled)}
          </div>
          {status.departure?.delay && status.departure.delay > 0 ? (
            <div className="text-xs text-amber-600">+{status.departure.delay} dk</div>
          ) : null}
        </div>

        <div className="flex-1 flex items-center justify-center px-2">
          <div className="h-px bg-border flex-1" />
          <Plane className="h-4 w-4 mx-2 text-muted-foreground" />
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="text-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <PlaneLanding className="h-3 w-3" />
            <span className="text-xs">Varış</span>
          </div>
          <div className="font-bold text-lg">{status.arrival?.iata || '--'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
            {status.arrival?.airport || 'Unknown'}
          </div>
          <div className="font-medium text-primary">
            {arrivalTime || formatTime(status.arrival?.scheduled)}
          </div>
          {status.arrival?.delay && status.arrival.delay > 0 ? (
            <div className="text-xs text-amber-600">+{status.arrival.delay} dk</div>
          ) : null}
        </div>
      </div>

      {lastRefresh && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <RefreshCw className="h-3 w-3" />
          <span>Son güncelleme: {format(lastRefresh, 'HH:mm')}</span>
        </div>
      )}
    </div>
  );
};

export default FlightStatus;
