import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EmailType = 
  | 'new_reservation_admin'
  | 'price_accepted_admin'
  | 'price_set_customer'
  | 'driver_assigned_driver';

interface EmailOptions {
  type: EmailType;
  reservation_id: string;
  additional_data?: {
    price?: number;
    currency?: string;
    driver_email?: string;
    driver_name?: string;
  };
}

export const useEmailNotifications = () => {
  const sendEmail = useCallback(async (options: EmailOptions) => {
    try {
      console.log('Sending email notification:', options.type);
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: options.type,
          reservation_id: options.reservation_id,
          additional_data: options.additional_data,
        },
      });

      if (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
      }

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Email notification error:', error);
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

  return {
    sendEmail,
    emailAdminNewReservation,
    emailAdminPriceAccepted,
    emailCustomerPriceSet,
    emailDriverAssigned,
  };
};
