import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Plane, AlertTriangle, PlaneLanding, PlaneTakeoff } from 'lucide-react';
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

export const FlightStatus = ({
  flightNumber,
  date,
  className,
  compact = false,
  reservationId,
  onStatusChange,
  refreshIntervalMs = 5 * 60 * 1000,
}: FlightStatusProps) => {
  const [status, setStatus] = useState<FlightStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastNotifiedRef = useRef<{ delay: number | null; status: string | null }>({ delay: null, status: null });
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const notifyDriver = useCallback(
    async (flightData: FlightStatusData) => {
      if (!reservationId || !flightData.found) return;

      const currentDelay = flightData.arrival?.delay || 0;
      const currentStatus = flightData.status?.toLowerCase() || '';

      const delayChanged =
        lastNotifiedRef.current.delay !== null &&
        Math.abs(currentDelay - lastNotifiedRef.current.delay) >= 15;

      const statusChanged =
        lastNotifiedRef.current.status !== null &&
        lastNotifiedRef.current.status !== currentStatus &&
        ['cancelled', 'landed', 'diverted'].includes(currentStatus);

      if (delayChanged || statusChanged) {
        try {
          await supabase.functions.invoke('notify-flight-delay', {
            body: {
              reservation_id: reservationId,
              flight_number: flightData.flightNumber,
              delay_minutes: currentDelay,
              status: currentStatus,
              arrival_time: flightData.arrival?.estimated || flightData.arrival?.scheduled,
            },
          });
          console.log('Driver notified about flight change');
        } catch (err) {
          console.error('Failed to notify driver:', err);
        }
      }

      lastNotifiedRef.current = { delay: currentDelay, status: currentStatus };
    },
    [reservationId]
  );

  const fetchStatus = useCallback(async () => {
    if (!flightNumber || flightNumber.trim().length < 3) {
      setStatus(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('flight-status', {
        body: { flightNumber: flightNumber.trim(), date },
      });

      if (invokeError) {
        console.error('Flight status error:', invokeError);
        setError('Unable to fetch flight status');
        setStatus(null);
        return;
      }

      setStatus(data);

      if (data?.found) {
        notifyDriver(data);
        onStatusChangeRef.current?.(data);
      }
    } catch (err) {
      console.error('Flight status fetch error:', err);
      setError('Unable to fetch flight status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [flightNumber, date, notifyDriver]);

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
      fetchStatus();
    }, refreshIntervalMs);

    return () => window.clearInterval(id);
  }, [flightNumber, refreshIntervalMs, fetchStatus]);

  if (!flightNumber || flightNumber.trim().length < 3) return null;
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Checking flight status...</span>
      </div>
    );
  }

  if (error || !status || !status.found) return null;

  const flightStatus = status.status?.toLowerCase() || 'scheduled';
  const hasDelay =
    (status.departure?.delay && status.departure.delay > 0) ||
    (status.arrival?.delay && status.arrival.delay > 0);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge className={cn('text-xs', statusColors[flightStatus] || statusColors.scheduled)}>
          {statusIcons[flightStatus] || <Plane className="h-3 w-3" />}
          <span className="ml-1 capitalize">{status.status || 'Scheduled'}</span>
        </Badge>
        {hasDelay && status.arrival?.delay ? (
          <span className="text-xs text-amber-600">+{status.arrival.delay} min delay</span>
        ) : null}
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
        {hasDelay ? (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Delayed
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <PlaneTakeoff className="h-3 w-3" />
            <span className="text-xs">Departure</span>
          </div>
          <div className="font-bold text-lg">{status.departure?.iata || '--'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
            {status.departure?.airport || 'Unknown'}
          </div>
          <div className="font-medium">
            {formatTime(status.departure?.actual || status.departure?.estimated || status.departure?.scheduled)}
          </div>
          {status.departure?.delay && status.departure.delay > 0 ? (
            <div className="text-xs text-amber-600">+{status.departure.delay} min</div>
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
            <span className="text-xs">Arrival</span>
          </div>
          <div className="font-bold text-lg">{status.arrival?.iata || '--'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
            {status.arrival?.airport || 'Unknown'}
          </div>
          <div className="font-medium">
            {formatTime(status.arrival?.actual || status.arrival?.estimated || status.arrival?.scheduled)}
          </div>
          {status.arrival?.delay && status.arrival.delay > 0 ? (
            <div className="text-xs text-amber-600">+{status.arrival.delay} min</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FlightStatus;
