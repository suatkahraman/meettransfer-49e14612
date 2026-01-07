import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { generateCustomerPriceQuoteEmail } from "../_shared/emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  language?: string;
  adminEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = 'en', adminEmail = 'sautkahraman@gmail.com' }: TestEmailRequest = await req.json();

    console.log("📧 Testing email template in language:", language);

    // Sample booking data for test
    const sampleBooking = {
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      has_return_trip: true,
      return_date: "2025-01-22",
      return_time: "10:00",
    };

    const samplePriceInfo = {
      price: 85,
      returnPrice: 51, // 40% discount on return
      totalPrice: 136,
      currency: 'EUR',
      discountApplied: true,
      discountPercent: 40,
    };

    const confirmUrl = "https://meettransfer.app/quick-booking-confirm?token=test-token";

    // Generate email in requested language
    const emailHtml = generateCustomerPriceQuoteEmail(
      sampleBooking,
      samplePriceInfo,
      confirmUrl,
      language
    );

    // Subject translations
    const subjectTranslations: Record<string, string> = {
      en: `[TEST] Your Transfer Quote: €85 - Meet Transfer`,
      tr: `[TEST] Transfer Teklifiniz: €85 - Meet Transfer`,
      de: `[TEST] Ihr Transferangebot: €85 - Meet Transfer`,
      ru: `[TEST] Ваше предложение по трансферу: €85 - Meet Transfer`,
      ar: `[TEST] عرض النقل الخاص بك: €85 - Meet Transfer`,
    };
    const emailSubject = subjectTranslations[language.substring(0, 2)] || subjectTranslations.en;

    const { error: emailError, data } = await resend.emails.send({
      from: "Meet Transfer <no-reply@meettransfer.app>",
      to: [adminEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("❌ Email send error:", emailError);
      throw emailError;
    }

    console.log("✅ Test email sent successfully to:", adminEmail, "in language:", language);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${adminEmail} in language: ${language}`,
        emailId: data?.id,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Test email error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
