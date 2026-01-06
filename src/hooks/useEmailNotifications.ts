import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EmailType = 
  | 'new_reservation_admin'
  | 'price_accepted_admin'
  | 'price_rejected_admin'
  | 'price_set_customer'
  | 'driver_assigned_driver'
  | 'driver_assigned_customer'
  | 'reservation_updated_driver'
  | 'payment_request_customer'
  | 'payment_confirmed_customer'
  | 'trip_completed_admin'
  | 'reservation_edited_admin'
  | 'reservation_cancelled_admin'
  | 'agency_request_admin'
  | 'agency_approved_agency'
  | 'agency_rejected_agency'
  | 'agency_price_set_agency'
  | 'agency_price_approved_admin'
  | 'agency_price_rejected_admin';

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
    agency_email?: string;
    rejection_reason?: string;
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
        console.error('Failed to send email - function invoke error:', error);
        const message = (error as any)?.message ? String((error as any).message) : String(error);
        return { success: false, error: message };
      }

      // The function may return HTTP 200 with { success: false, ... }.
      // Treat that as a failure so the UI can surface the real reason.
      const anyData = data as any;
      if (anyData?.success === false) {
        console.error('Email function reported failure:', JSON.stringify(anyData));
        return {
          success: false,
          error: anyData?.message || anyData?.error || 'Email function reported failure',
          data,
        };
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

  // 4c. When reservation is updated and driver is assigned → Email to driver
  const emailDriverReservationUpdated = useCallback(async (
    reservationId: string,
    driverEmail?: string,
    driverName?: string
  ) => {
    return sendEmail({
      type: 'reservation_updated_driver',
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

  // 11. When agency creates reservation request → Email to admin
  const emailAdminAgencyRequest = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'agency_request_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 12. When admin approves agency request → Email to agency
  const emailAgencyApproved = useCallback(async (reservationId: string, agencyEmail?: string) => {
    return sendEmail({
      type: 'agency_approved_agency',
      reservation_id: reservationId,
      additional_data: { agency_email: agencyEmail },
    });
  }, [sendEmail]);

  // 13. When admin rejects agency request → Email to agency
  const emailAgencyRejected = useCallback(async (reservationId: string, agencyEmail?: string, rejectionReason?: string) => {
    return sendEmail({
      type: 'agency_rejected_agency',
      reservation_id: reservationId,
      additional_data: { agency_email: agencyEmail, rejection_reason: rejectionReason },
    });
  }, [sendEmail]);

  // 14. When admin sets price for agency request → Email to agency
  const emailAgencyPriceSet = useCallback(async (
    reservationId: string,
    price?: number,
    currency?: string
  ) => {
    return sendEmail({
      type: 'agency_price_set_agency',
      reservation_id: reservationId,
      additional_data: { price, currency },
    });
  }, [sendEmail]);

  // 15. When agency approves price → Email to admin
  const emailAdminAgencyPriceApproved = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'agency_price_approved_admin',
      reservation_id: reservationId,
    });
  }, [sendEmail]);

  // 16. When agency rejects price → Email to admin
  const emailAdminAgencyPriceRejected = useCallback(async (reservationId: string) => {
    return sendEmail({
      type: 'agency_price_rejected_admin',
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
    emailDriverReservationUpdated,
    emailCustomerDriverAssigned,
    emailPaymentRequest,
    emailPaymentConfirmed,
    emailAdminTripCompleted,
    emailAdminReservationEdited,
    emailAdminReservationCancelled,
    emailAdminAgencyRequest,
    emailAgencyApproved,
    emailAgencyRejected,
    emailAgencyPriceSet,
    emailAdminAgencyPriceApproved,
    emailAdminAgencyPriceRejected,
  };
};
