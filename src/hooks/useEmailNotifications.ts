import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EmailType = 
  | 'new_reservation_admin'
  | 'price_accepted_admin'
  | 'price_rejected_admin'
  | 'price_set_customer'
  | 'driver_assigned_driver'
  | 'driver_assigned_customer'
  | 'payment_request_customer'
  | 'payment_confirmed_customer'
  | 'trip_completed_admin'
  | 'reservation_edited_admin'
  | 'reservation_cancelled_admin';

interface EmailOptions {
  type: EmailType;
  reservation_id: string;
  additional_data?: {
    price?: number;
    currency?: string;
    driver_email?: string;
    driver_name?: string;
    driver_plate?: string;
    payment_link?: string;
  };
}

export const useEmailNotifications = () => {
  const sendEmail = useCallback(async (options: EmailOptions) => {
    try {
      console.log('Sending email notification:', options.type, 'for reservation:', options.reservation_id);
      console.log('Additional data:', JSON.stringify(options.additional_data));
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: options.type,
          reservation_id: options.reservation_id,
          additional_data: options.additional_data,
        },
      });

      if (error) {
        console.error('Failed to send email - Supabase error:', error);
        return { success: false, error };
      }

      console.log('Email function response:', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      console.error('Email notification exception:', error);
      return { success: false, error };
    }
  }, []);

  // 1. When customer creates reservation → Email to admin
  const emailAdminNewReservation = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'new_reservation_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 2. When customer accepts price → Email to admin
  const emailAdminPriceAccepted = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'price_accepted_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 3. When admin sets price → Email to customer
  const emailCustomerPriceSet = useCallback(async (
    reservationId: string,
    price?: number,
    currency?: string
  ) => {
    return sendEmail({
      type: 'price_set_customer',
      reservation_id: reservationId,
      additional_data: { price, currency },
    });
  }, [sendEmail]);

  // 4. When admin assigns driver → Email to driver
  const emailDriverAssigned = useCallback(async (
    reservationId: string,
    driverEmail?: string,
    driverName?: string
  ) => {
    return sendEmail({
      type: 'driver_assigned_driver',
      reservation_id: reservationId,
      additional_data: { driver_email: driverEmail, driver_name: driverName },
    });
  }, [sendEmail]);

  // 4b. When admin assigns driver → Email to customer (only name & plate)
  const emailCustomerDriverAssigned = useCallback(async (
    reservationId: string,
    driverName?: string,
    driverPlate?: string
  ) => {
    return sendEmail({
      type: 'driver_assigned_customer',
      reservation_id: reservationId,
      additional_data: { driver_name: driverName, driver_plate: driverPlate },
    });
  }, [sendEmail]);

  // 5. When admin sends payment link → Email to customer
  const emailPaymentRequest = useCallback(async (
    reservationId: string,
    paymentLink: string
  ) => {
    return sendEmail({
      type: 'payment_request_customer',
      reservation_id: reservationId,
      additional_data: { payment_link: paymentLink },
    });
  }, [sendEmail]);

  // 6. When admin confirms payment → Email to customer
  const emailPaymentConfirmed = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'payment_confirmed_customer',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 7. When customer rejects price → Email to admin (info@meettransfer.app)
  const emailAdminPriceRejected = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'price_rejected_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 8. When driver completes trip → Email to admin (info@meettransfer.app)
  const emailAdminTripCompleted = useCallback(async (
    reservationId: string,
    driverName?: string
  ) => {
    return sendEmail({
      type: 'trip_completed_admin',
      reservation_id: reservationId,
      additional_data: { driver_name: driverName },
    });
  }, [sendEmail]);

  // 9. When customer edits reservation → Email to admin (info@meettransfer.app)
  const emailAdminReservationEdited = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'reservation_edited_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 10. When customer cancels reservation → Email to admin (info@meettransfer.app)
  const emailAdminReservationCancelled = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'reservation_cancelled_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  return {
    sendEmail,
    emailAdminNewReservation,
    emailAdminPriceAccepted,
    emailAdminPriceRejected,
    emailCustomerPriceSet,
    emailDriverAssigned,
    emailCustomerDriverAssigned,
    emailPaymentRequest,
    emailPaymentConfirmed,
    emailAdminTripCompleted,
    emailAdminReservationEdited,
    emailAdminReservationCancelled,
  };
};
