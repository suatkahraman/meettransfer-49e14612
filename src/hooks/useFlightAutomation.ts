import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FlightArrivalData {
  arrivalTime: string | null; // HH:mm format
  flightStatus: string | null;
  delay: number | null;
  airport: string | null;
}

interface UseFlightAutomationOptions {
  reservationId?: string;
  onArrivalTimeUpdated?: (time: string) => void;
}

export const useFlightAutomation = (options: UseFlightAutomationOptions = {}) => {
  const { reservationId, onArrivalTimeUpdated } = options;
  const lastProcessedRef = useRef<string | null>(null);

  /**
   * Extract arrival time from flight data (actual > estimated > scheduled)
   */
  const extractArrivalTime = useCallback((flightData: any): FlightArrivalData => {
    if (!flightData?.found || !flightData?.arrival) {
      return { arrivalTime: null, flightStatus: null, delay: null, airport: null };
    }

    const arrival = flightData.arrival;
    let arrivalTimeStr = arrival.actual || arrival.estimated || arrival.scheduled;
    
    let arrivalTime: string | null = null;
    if (arrivalTimeStr) {
      try {
        const date = new Date(arrivalTimeStr);
        arrivalTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
        arrivalTime = null;
      }
    }

    return {
      arrivalTime,
      flightStatus: flightData.status?.toLowerCase() || null,
      delay: arrival.delay || null,
      airport: arrival.airport || null,
    };
  }, []);

  /**
   * Update reservation with flight arrival time
   */
  const updateReservationArrivalTime = useCallback(async (
    resId: string,
    arrivalTime: string,
    flightStatus: string | null
  ) => {
    console.log(`[FlightAutomation] Updating reservation ${resId} arrival time to ${arrivalTime}`);

    const { error } = await supabase
      .from('reservations')
      .update({
        flight_arrival_time: arrivalTime,
        flight_status: flightStatus,
        flight_last_checked: new Date().toISOString(),
      })
      .eq('id', resId);

    if (error) {
      console.error('[FlightAutomation] Failed to update arrival time:', error);
      return false;
    }

    console.log(`[FlightAutomation] Successfully updated arrival time for ${resId}`);
    return true;
  }, []);

  /**
   * Check if arrival time has changed significantly (more than 5 minutes)
   */
  const hasSignificantChange = useCallback((oldTime: string | null, newTime: string): boolean => {
    if (!oldTime) return true;
    
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    
    const oldMinutes = parseTime(oldTime);
    const newMinutes = parseTime(newTime);
    const diff = Math.abs(newMinutes - oldMinutes);
    
    return diff >= 5; // 5 minute threshold
  }, []);

  /**
   * Send notification to driver about flight update
   */
  const notifyDriverFlightUpdate = useCallback(async (
    resId: string,
    flightNumber: string,
    oldArrivalTime: string | null,
    newArrivalTime: string,
    flightStatus: string | null,
    delay: number | null
  ) => {
    console.log(`[FlightAutomation] Sending driver notification for ${resId}`);
    console.log(`[FlightAutomation] Old time: ${oldArrivalTime}, New time: ${newArrivalTime}`);

    try {
      const { error } = await supabase.functions.invoke('notify-flight-delay', {
        body: {
          reservation_id: resId,
          flight_number: flightNumber,
          delay_minutes: delay || 0,
          status: flightStatus || 'updated',
          arrival_time: newArrivalTime,
          old_arrival_time: oldArrivalTime,
        },
      });

      if (error) {
        console.error('[FlightAutomation] Failed to notify driver:', error);
        return false;
      }

      console.log('[FlightAutomation] Driver notification sent successfully');
      return true;
    } catch (err) {
      console.error('[FlightAutomation] Error sending driver notification:', err);
      return false;
    }
  }, []);

  /**
   * Process flight status change from FlightStatus component
   */
  const handleFlightStatusChange = useCallback(async (
    flightData: any,
    flightNumber: string,
    currentPickupTime: string | null
  ) => {
    const targetResId = reservationId;
    if (!targetResId) {
      console.log('[FlightAutomation] No reservation ID provided');
      return;
    }

    const { arrivalTime, flightStatus, delay } = extractArrivalTime(flightData);
    
    if (!arrivalTime) {
      console.log('[FlightAutomation] No arrival time extracted from flight data');
      return;
    }

    // Prevent duplicate processing
    const processKey = `${targetResId}-${arrivalTime}-${flightStatus}`;
    if (lastProcessedRef.current === processKey) {
      console.log('[FlightAutomation] Already processed this update, skipping');
      return;
    }

    // Get current reservation data
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('flight_arrival_time, last_notified_arrival_time, pickup_time, driver_id, flight_number')
      .eq('id', targetResId)
      .single();

    if (fetchError || !reservation) {
      console.error('[FlightAutomation] Failed to fetch reservation:', fetchError);
      return;
    }

    const currentArrivalTime = reservation.flight_arrival_time;
    const lastNotifiedTime = reservation.last_notified_arrival_time;

    // Check if arrival time has changed
    if (currentArrivalTime !== arrivalTime) {
      console.log(`[FlightAutomation] Arrival time changed: ${currentArrivalTime} -> ${arrivalTime}`);
      
      // Update reservation with new arrival time
      await updateReservationArrivalTime(targetResId, arrivalTime, flightStatus);
      
      // Callback for UI update
      onArrivalTimeUpdated?.(arrivalTime);

      // Check if we should notify driver (significant change and not already notified)
      if (reservation.driver_id && hasSignificantChange(lastNotifiedTime, arrivalTime)) {
        console.log('[FlightAutomation] Significant change detected, notifying driver');
        
        const notified = await notifyDriverFlightUpdate(
          targetResId,
          flightNumber,
          lastNotifiedTime,
          arrivalTime,
          flightStatus,
          delay
        );

        if (notified) {
          // Update last notified time to prevent duplicates
          await supabase
            .from('reservations')
            .update({ last_notified_arrival_time: arrivalTime })
            .eq('id', targetResId);
        }
      } else if (!reservation.driver_id) {
        console.log('[FlightAutomation] No driver assigned, skipping notification');
      } else {
        console.log('[FlightAutomation] Change not significant enough for notification');
      }
    } else {
      console.log('[FlightAutomation] Arrival time unchanged');
    }

    lastProcessedRef.current = processKey;
  }, [reservationId, extractArrivalTime, updateReservationArrivalTime, hasSignificantChange, notifyDriverFlightUpdate, onArrivalTimeUpdated]);

  /**
   * Fetch flight status and update reservation
   */
  const fetchAndUpdateFlightStatus = useCallback(async (
    flightNumber: string,
    date: string,
    resId: string
  ) => {
    if (!flightNumber || flightNumber.trim().length < 3) {
      return null;
    }

    console.log(`[FlightAutomation] Fetching flight status for ${flightNumber}`);

    try {
      const { data, error } = await supabase.functions.invoke('flight-status', {
        body: { flightNumber: flightNumber.trim(), date },
      });

      if (error || !data?.found) {
        console.log('[FlightAutomation] Flight not found or error:', error);
        return null;
      }

      await handleFlightStatusChange(data, flightNumber, null);
      return data;
    } catch (err) {
      console.error('[FlightAutomation] Failed to fetch flight status:', err);
      return null;
    }
  }, [handleFlightStatusChange]);

  return {
    handleFlightStatusChange,
    fetchAndUpdateFlightStatus,
    extractArrivalTime,
    updateReservationArrivalTime,
  };
};

export default useFlightAutomation;
