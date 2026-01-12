import { supabase } from "@/integrations/supabase/client";

interface NotifyCustomerParams {
  customerId: string;
  reservationCode: string;
  oldStatus: string;
  newStatus: string;
  language?: string;
}

export const useCustomerNotification = () => {
  const notifyStatusChange = async (params: NotifyCustomerParams) => {
    // Don't notify if status hasn't changed
    if (params.oldStatus === params.newStatus) {
      console.log("Status unchanged, skipping customer notification");
      return { success: true, skipped: true };
    }

    // Don't notify if no customer is linked
    if (!params.customerId) {
      console.log("No customer ID, skipping notification");
      return { success: true, skipped: true };
    }

    try {
      console.log("Sending customer notification for status change:", params);
      
      const { data, error } = await supabase.functions.invoke("notify-customer-reservation-status", {
        body: params,
      });

      if (error) {
        console.error("Failed to notify customer:", error);
        return { success: false, error };
      }

      console.log("Customer notification sent successfully:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Customer notification error:", error);
      return { success: false, error };
    }
  };

  return { notifyStatusChange };
};
