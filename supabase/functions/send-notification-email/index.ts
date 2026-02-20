import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  passengers: number;
  price: number;
  currency: string;
  flight_number?: string;
  notes?: string;
  payment_status: string;
  payment_type: string;
  driver_id?: string;
  vehicle_id?: string;
  baby_seat_count?: number;
}

interface EmailData {
  type:
    | "new_reservation_admin"
    | "driver_assigned_customer"
    | "payment_request_customer"
    | "reservation_cancelled_admin"
    | "reservation_cancelled_customer";
  booking: Booking;
  paymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailData = await req.json();
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let subject = "";
    let html = "";
    let to = "";

    switch (data.type) {
      case 'new_reservation_admin':
        subject = `Yeni Rezervasyon: ${data.booking.passenger_name} - ${data.booking.pickup_date}`;
        to = 'admin@meettransfer.com';
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Yeni Rezervasyon</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Yeni Rezervasyon Bildirimi</h2>
                <p>Yeni bir rezervasyon alındı. Detaylar aşağıdadır:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Müşteri:</td>
                    <td style="padding: 10px;">${data.booking.passenger_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Telefon:</td>
                    <td style="padding: 10px;">${data.booking.passenger_phone}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Email:</td>
                    <td style="padding: 10px;">${data.booking.passenger_email}</td>
                  </tr>
                </table>

                <h3 style="color: #4b5563; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Transfer Detayları</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Alış Yeri:</td>
                    <td style="padding: 10px;">${data.booking.pickup_location}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Varış Yeri:</td>
                    <td style="padding: 10px;">${data.booking.dropoff_location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Tarih/Saat:</td>
                    <td style="padding: 10px;">${data.booking.pickup_date} ${data.booking.pickup_time}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Yolcu Sayısı:</td>
                    <td style="padding: 10px;">${data.booking.passengers}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Bebek Koltuğu:</td>
                    <td style="padding: 10px;">${data.booking.baby_seat_count || 0}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Fiyat:</td>
                    <td style="padding: 10px;">${data.booking.price} ${data.booking.currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Ödeme Türü:</td>
                    <td style="padding: 10px;">${
                      data.booking.payment_type === 'cash' ? 'Nakit' : 'Kredi Kartı'
                    }</td>
                  </tr>
                  ${data.booking.flight_number ? `
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Uçuş No:</td>
                    <td style="padding: 10px;">${data.booking.flight_number}</td>
                  </tr>` : ''}
                  ${data.booking.notes ? `
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Notlar:</td>
                    <td style="padding: 10px;">${data.booking.notes}</td>
                  </tr>` : ''}
                </table>
              </div>
            </body>
          </html>
        `;
        break;

      case 'driver_assigned_customer':
        subject = 'Transferiniz İçin Sürücü Atandı - Meet Transfer';
        to = data.booking.passenger_email;
        
        // Get driver details
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*, vehicles(*)')
          .eq('id', data.booking.driver_id)
          .single();

        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Sürücünüz Atandı</h2>
                <p>Sayın ${data.booking.passenger_name},</p>
                <p>Transferiniz için sürücü ataması yapılmıştır. Sürücü ve araç bilgileri aşağıdadır:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #4b5563;">Sürücü Bilgileri</h3>
                  <p><strong>Ad Soyad:</strong> ${driverData?.first_name} ${driverData?.last_name}</p>
                  <p><strong>Telefon:</strong> ${driverData?.phone_number}</p>
                  
                  <h3 style="color: #4b5563; margin-top: 20px;">Araç Bilgileri</h3>
                  <p><strong>Marka/Model:</strong> ${driverData?.vehicles?.make} ${driverData?.vehicles?.model}</p>
                  <p><strong>Plaka:</strong> ${driverData?.vehicles?.plate_number}</p>
                  <p><strong>Renk:</strong> ${driverData?.vehicles?.color}</p>
                </div>

                <p>İyi yolculuklar dileriz.</p>
              </div>
            </body>
          </html>
        `;
        break;

      case 'payment_request_customer':
        subject = 'Ödeme Hatırlatması - Meet Transfer';
        to = data.booking.passenger_email;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Ödeme İşlemi</h2>
                <p>Sayın ${data.booking.passenger_name},</p>
                <p>${data.booking.pickup_date} tarihli transfer rezervasyonunuz için ödeme işlemini tamamlamanız gerekmektedir.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Tutar:</strong> ${data.booking.price} ${data.booking.currency}</p>
                  <div style="text-align: center; margin-top: 25px;">
                    <a href="${data.paymentLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ödeme Yap</a>
                  </div>
                </div>

                <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
              </div>
            </body>
          </html>
        `;
        break;

      case 'reservation_cancelled_admin':
        subject = `İPTAL: Rezervasyon İptali - ${data.booking.passenger_name}`;
        to = 'admin@meettransfer.com';
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Rezervasyon İptal Bildirimi</h2>
                <p>Aşağıdaki rezervasyon iptal edilmiştir:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Müşteri:</td>
                    <td style="padding: 10px;">${data.booking.passenger_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Tarih:</td>
                    <td style="padding: 10px;">${data.booking.pickup_date}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; font-weight: bold;">Güzergah:</td>
                    <td style="padding: 10px;">${data.booking.pickup_location} > ${data.booking.dropoff_location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Sebep:</td>
                    <td style="padding: 10px;">${data.booking.notes || 'Belirtilmedi'}</td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
        `;
        break;

      case 'reservation_cancelled_customer':
        subject = 'Rezervasyon İptali - Meet Transfer';
        to = data.booking.passenger_email;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Rezervasyonunuz İptal Edildi</h2>
                <p>Sayın ${data.booking.passenger_name},</p>
                <p>${data.booking.pickup_date} tarihli transfer rezervasyonunuz talebiniz üzerine iptal edilmiştir.</p>
                <p>Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>
                <p>Saygılarımızla,<br>Meet Transfer Ekibi</p>
              </div>
            </body>
          </html>
        `;
        break;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@meettransfer.com>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const dataRes = await res.json();

    return new Response(JSON.stringify(dataRes), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
};

serve(handler);
