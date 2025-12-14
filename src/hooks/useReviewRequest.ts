import { supabase } from "@/integrations/supabase/client";

interface ReviewRequestParams {
  reservationId: string;
  customerEmail: string;
  customerName: string;
  driverName: string;
  reservationCode: string;
  pickupDate: string;
  pickup: string;
  dropoff: string;
}

export const useReviewRequest = () => {
  const sendReviewRequest = async (params: ReviewRequestParams) => {
    try {
      console.log("Sending review request email:", params);
      
      const { data, error } = await supabase.functions.invoke("send-review-request", {
        body: params,
      });

      if (error) {
        console.error("Error sending review request:", error);
        return { success: false, error };
      }

      console.log("Review request sent successfully:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Error in sendReviewRequest:", error);
      return { success: false, error };
    }
  };

  return { sendReviewRequest };
};
