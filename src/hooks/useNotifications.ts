import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type NotificationType = 
  | 'price_ready'
  | 'reservation_confirmed'
  | 'reservation_updated'
  | 'reservation_cancelled'
  | 'driver_assigned'
  | 'driver_on_way'
  | 'trip_completed'
  | 'new_reservation'
  | 'reservation_edited'
  | 'customer_cancelled'
  | 'driver_accepted'
  | 'driver_updated_payment'
  | 'driver_reminder'
  | 'admin_updated_price'
  | 'payment_method_changed'
  | 'other';

interface NotificationOptions {
  user_id?: string;
  reservation_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  notify_admins?: boolean;
  send_push?: boolean;
  send_whatsapp?: boolean;
  url?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();

  const sendNotification = useCallback(async (options: NotificationOptions) => {
    if (!user) {
      console.warn('Cannot send notification: no user logged in');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Create in-app notification
      const { data, error } = await supabase.functions.invoke('create-notification', {
        body: {
          user_id: options.user_id,
          reservation_id: options.reservation_id,
          title: options.title,
          message: options.message,
          type: options.type,
          notify_admins: options.notify_admins,
          send_push: options.send_push,
          url: options.url,
        }
      });

      if (error) {
        console.error('Failed to create notification:', error);
        return { success: false, error };
      }

      // Send push notification for individual user (non-admin case)
      if (options.send_push && options.user_id && !options.notify_admins) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: options.user_id,
              title: options.title,
              body: options.message,
              url: options.url || `/customer/reservation/${options.reservation_id}`,
            }
          });
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
          // Don't fail the whole operation if push fails
        }
      }

      // Also send WhatsApp message if requested (for admin/driver users)
      if (options.send_whatsapp && options.user_id) {
        try {
          await supabase.functions.invoke('send-whatsapp', {
            body: {
              user_id: options.user_id,
              title: options.title,
              message: options.message,
            }
          });
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
          // Don't fail the whole operation if WhatsApp fails
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error };
    }
  }, [user]);

  // Convenience methods for common notifications
  const notifyCustomerPriceReady = useCallback(async (
    customerId: string, 
    reservationId: string, 
    price: number, 
    currency: string
  ) => {
    const symbols: Record<string, string> = { TRY: '₺', EUR: '€', USD: '$', GBP: '£', AED: 'د.إ', AUD: 'A$' };
    const symbol = symbols[currency] || currency;
    
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '💰 Your Transfer Price is Ready',
      message: `Your transfer price has been set: ${symbol}${price}. Please review and confirm your booking.`,
      type: 'price_ready',
      send_push: true,
      url: `/customer/reservation/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyCustomerReservationConfirmed = useCallback(async (
    customerId: string,
    reservationId: string
  ) => {
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '✅ Reservation Confirmed',
      message: 'Your reservation has been confirmed! A driver will be assigned soon.',
      type: 'reservation_confirmed',
      send_push: true,
      url: `/customer/reservation/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyCustomerReservationUpdated = useCallback(async (
    customerId: string,
    reservationId: string,
    changes: string
  ) => {
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '📝 Reservation Updated',
      message: `Your reservation has been updated: ${changes}`,
      type: 'reservation_updated',
      send_push: true,
      url: `/customer/reservation/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyCustomerReservationCancelled = useCallback(async (
    customerId: string,
    reservationId: string,
    reason?: string
  ) => {
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '❌ Reservation Cancelled',
      message: reason ? `Your reservation has been cancelled: ${reason}` : 'Your reservation has been cancelled.',
      type: 'reservation_cancelled',
      send_push: true,
      url: `/customer/bookings`,
    });
  }, [sendNotification]);

  const notifyCustomerDriverAssigned = useCallback(async (
    customerId: string,
    reservationId: string,
    driverName: string,
    plateNumber?: string
  ) => {
    // Only show driver name and plate - no phone, no vehicle model
    const message = plateNumber 
      ? `Your driver: ${driverName} (${plateNumber})`
      : `Your driver: ${driverName}`;
    
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '🚗 Driver Assigned',
      message: message,
      type: 'driver_assigned',
      send_push: true,
      url: `/customer/reservation/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyCustomerTripCompleted = useCallback(async (
    customerId: string,
    reservationId: string
  ) => {
    return sendNotification({
      user_id: customerId,
      reservation_id: reservationId,
      title: '🎉 Trip Completed',
      message: 'Your trip has been completed. Thank you for choosing Meet Transfer!',
      type: 'trip_completed',
      send_push: true,
      url: `/customer/reservation/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyDriverNewJob = useCallback(async (
    driverUserId: string,
    reservationId: string,
    pickup: string,
    dropoff: string,
    date: string,
    time: string,
    price?: number,
    currency?: string
  ) => {
    const symbols: Record<string, string> = { TRY: '₺', EUR: '€', USD: '$', GBP: '£', AED: 'د.إ', AUD: 'A$' };
    const symbol = currency ? (symbols[currency] || currency) : '';
    const priceText = price ? ` Price: ${symbol}${price}` : '';
    
    return sendNotification({
      user_id: driverUserId,
      reservation_id: reservationId,
      title: '🚕 New Job Assigned',
      message: `New transfer: ${pickup} → ${dropoff} on ${date} at ${time}.${priceText}`,
      type: 'driver_assigned',
      send_push: true,
      send_whatsapp: true,
      url: `/driver/job/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyDriverReservationUpdated = useCallback(async (
    driverUserId: string,
    reservationId: string,
    changes: string
  ) => {
    return sendNotification({
      user_id: driverUserId,
      reservation_id: reservationId,
      title: '📝 Reservation Updated',
      message: `Reservation updated: ${changes}`,
      type: 'reservation_updated',
      send_push: true,
      send_whatsapp: true,
      url: `/driver/job/${reservationId}`,
    });
  }, [sendNotification]);

  const notifyDriverReservationCancelled = useCallback(async (
    driverUserId: string,
    reservationId: string
  ) => {
    return sendNotification({
      user_id: driverUserId,
      reservation_id: reservationId,
      title: '❌ Reservation Cancelled',
      message: 'A reservation assigned to you has been cancelled.',
      type: 'reservation_cancelled',
      send_push: true,
      send_whatsapp: true,
      url: `/driver`,
    });
  }, [sendNotification]);

  const notifyAdminsNewReservation = useCallback(async (
    reservationId: string,
    customerName: string
  ) => {
    return sendNotification({
      reservation_id: reservationId,
      title: '📬 New Reservation Request',
      message: `New transfer request from ${customerName}. Please set a price.`,
      type: 'new_reservation',
      notify_admins: true,
      send_push: true,
      send_whatsapp: true,
    });
  }, [sendNotification]);

  const notifyAdminsCustomerEdited = useCallback(async (
    reservationId: string
  ) => {
    return sendNotification({
      reservation_id: reservationId,
      title: '✏️ Customer Updated Reservation',
      message: 'A customer has modified a confirmed reservation. Please review the changes.',
      type: 'reservation_edited',
      notify_admins: true,
      send_push: true,
    });
  }, [sendNotification]);

  const notifyAdminsCustomerCancelled = useCallback(async (
    reservationId: string,
    customerName: string
  ) => {
    return sendNotification({
      reservation_id: reservationId,
      title: '❌ Customer Cancelled Reservation',
      message: `${customerName} has cancelled their reservation.`,
      type: 'customer_cancelled',
      notify_admins: true,
      send_push: true,
    });
  }, [sendNotification]);

  const notifyAdminsDriverAccepted = useCallback(async (
    reservationId: string,
    driverName: string
  ) => {
    return sendNotification({
      reservation_id: reservationId,
      title: '✅ Driver Accepted Job',
      message: `${driverName} has accepted the job.`,
      type: 'driver_accepted',
      notify_admins: true,
      send_push: true,
    });
  }, [sendNotification]);

  const notifyAdminsDriverUpdatedPayment = useCallback(async (
    reservationId: string,
    driverName: string,
    changes: string
  ) => {
    return sendNotification({
      reservation_id: reservationId,
      title: '💵 Driver Updated Payment Info',
      message: `${driverName} updated payment: ${changes}`,
      type: 'driver_updated_payment',
      notify_admins: true,
      send_push: true,
    });
  }, [sendNotification]);

  // Notify admins when customer/agency changes payment method
  const notifyAdminsPaymentMethodChanged = useCallback(async (
    reservationId: string,
    customerName: string,
    oldMethod: string,
    newMethod: string
  ) => {
    const methodLabels: Record<string, string> = {
      stripe: 'Credit Card',
      paypal: 'PayPal',
      cash: 'Cash to Driver',
    };
    const oldLabel = methodLabels[oldMethod] || oldMethod;
    const newLabel = methodLabels[newMethod] || newMethod;
    
    return sendNotification({
      reservation_id: reservationId,
      title: '💳 Payment Method Changed',
      message: `${customerName} changed payment: ${oldLabel} → ${newLabel}`,
      type: 'payment_method_changed',
      notify_admins: true,
      send_push: true,
    });
  }, [sendNotification]);

  return {
    sendNotification,
    // Customer notifications
    notifyCustomerPriceReady,
    notifyCustomerReservationConfirmed,
    notifyCustomerReservationUpdated,
    notifyCustomerReservationCancelled,
    notifyCustomerDriverAssigned,
    notifyCustomerTripCompleted,
    // Driver notifications
    notifyDriverNewJob,
    notifyDriverReservationUpdated,
    notifyDriverReservationCancelled,
    // Admin notifications
    notifyAdminsNewReservation,
    notifyAdminsCustomerEdited,
    notifyAdminsCustomerCancelled,
    notifyAdminsDriverAccepted,
    notifyAdminsDriverUpdatedPayment,
    notifyAdminsPaymentMethodChanged,
  };
};
