import { useMemo } from 'react';

interface ReservationData {
  pickup_date: string;
  pickup_time: string;
  status: string;
}

interface CompletionValidation {
  canComplete: boolean;
  reason: string | null;
  isCompleted: boolean;
}

/**
 * Hook to validate if a reservation can be marked as completed
 * Rules:
 * 1. Only one reservation can be completed at a time (handled by UI - no bulk actions)
 * 2. Reservation can only be completed on same day or past (not future dates)
 * 3. Cannot be completed before scheduled pickup time
 * 4. Already completed reservations cannot be completed again
 */
export const useCompletionValidation = (reservation: ReservationData | null): CompletionValidation => {
  return useMemo(() => {
    if (!reservation) {
      return { canComplete: false, reason: 'Rezervasyon bulunamadı', isCompleted: false };
    }

    // Check if already completed
    if (reservation.status === 'completed') {
      return { canComplete: false, reason: null, isCompleted: true };
    }

    // Only active status can be completed
    if (reservation.status !== 'active') {
      return { canComplete: false, reason: 'Bu transfer henüz aktif durumda değil', isCompleted: false };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse pickup date
    const pickupDate = new Date(reservation.pickup_date);
    const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    
    // Parse pickup time
    const [hours, minutes] = reservation.pickup_time.split(':').map(Number);
    const pickupDateTime = new Date(pickupDateOnly);
    pickupDateTime.setHours(hours, minutes, 0, 0);

    // Rule 2: Check if pickup date is in the future (not allowed)
    // Future date = pickup date is after today
    if (pickupDateOnly > today) {
      const formattedDate = pickupDateOnly.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      return { 
        canComplete: false, 
        reason: `Bu transfer ${formattedDate} tarihinde planlanmış. Transfer günü gelmeden tamamlanamaz.`, 
        isCompleted: false 
      };
    }

    // Rule 3: On the same day, cannot complete before pickup time
    if (pickupDateOnly.getTime() === today.getTime()) {
      if (now < pickupDateTime) {
        const formattedTime = reservation.pickup_time;
        return { 
          canComplete: false, 
          reason: `Bu transfer saat ${formattedTime} için planlanmış. Planlanan transfer saati geçmeden tamamlanamaz.`, 
          isCompleted: false 
        };
      }
    }

    // Past dates or current date after pickup time - can complete
    return { canComplete: true, reason: null, isCompleted: false };
  }, [reservation?.pickup_date, reservation?.pickup_time, reservation?.status]);
};

/**
 * Utility function to check completion eligibility (for use outside React components)
 */
export const checkCompletionEligibility = (reservation: ReservationData): CompletionValidation => {
  if (!reservation) {
    return { canComplete: false, reason: 'Rezervasyon bulunamadı', isCompleted: false };
  }

  if (reservation.status === 'completed') {
    return { canComplete: false, reason: null, isCompleted: true };
  }

  if (reservation.status !== 'active') {
    return { canComplete: false, reason: 'Bu transfer henüz aktif durumda değil', isCompleted: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const pickupDate = new Date(reservation.pickup_date);
  const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
  
  const [hours, minutes] = reservation.pickup_time.split(':').map(Number);
  const pickupDateTime = new Date(pickupDateOnly);
  pickupDateTime.setHours(hours, minutes, 0, 0);

  if (pickupDateOnly > today) {
    const formattedDate = pickupDateOnly.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    return { 
      canComplete: false, 
      reason: `Bu transfer ${formattedDate} tarihinde planlanmış. Transfer günü gelmeden tamamlanamaz.`, 
      isCompleted: false 
    };
  }

  if (pickupDateOnly.getTime() === today.getTime()) {
    if (now < pickupDateTime) {
      return { 
        canComplete: false, 
        reason: `Bu transfer saat ${reservation.pickup_time} için planlanmış. Planlanan transfer saati geçmeden tamamlanamaz.`, 
        isCompleted: false 
      };
    }
  }

  return { canComplete: true, reason: null, isCompleted: false };
};

export default useCompletionValidation;
