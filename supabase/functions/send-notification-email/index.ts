import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "sautkahraman@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailType = 
  | 'new_reservation_admin'      // Customer creates reservation → Admin
  | 'price_accepted_admin'       // Customer accepts price → Admin
  | 'price_rejected_admin'       // Customer rejects price → Admin
  | 'price_set_customer'         // Admin sets price → Customer
  | 'driver_assigned_driver'     // Admin assigns driver → Driver
  | 'payment_request_customer'   // Admin sends payment link → Customer
  | 'payment_confirmed_customer' // Admin confirms payment → Customer
  | 'trip_completed_admin'       // Driver completes trip → Admin
  | 'reservation_edited_admin'   // Customer edits reservation → Admin
  | 'reservation_cancelled_admin'; // Customer cancels reservation → Admin

interface EmailRequest {
  type: EmailType;
  reservation_id: string;
  additional_data?: {
    price?: number;
    currency?: string;
    driver_email?: string;
    driver_name?: string;
    payment_link?: string;
  };
}

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
};

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'mercedes-vclass': 'Mercedes Vip Vito',
  'maybach': 'Maybach',
  'minibus': 'Minibus',
};

const getVehicleLabel = (vehicleType: string): string => {
  return vehicleTypeLabels[vehicleType] || vehicleType.replace(/-/g, ' ');
};

const getEmailTemplate = (type: EmailType, data: any) => {
  const baseUrl = "https://meettransfer.app";
  
  switch (type) {
    case 'new_reservation_admin':
      return {
        subject: `🔔 New Price Request - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #fdd835 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #111; margin: 0; font-size: 24px;">📬 New Price Request</h1>
              <p style="color: #333; margin-top: 10px; font-size: 14px;">A customer is waiting for a transfer price</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #fdd835; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Customer Email</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_email || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Phone</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_phone}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Pick-up</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Drop-off</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Vehicle Type</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${getVehicleLabel(data.vehicle_type)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Passengers</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.passengers}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${baseUrl}/admin/reservations" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Set Price Now</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'price_accepted_admin':
      return {
        subject: `✅ Price Accepted - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Price Accepted!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Customer has confirmed the transfer price</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #4caf50; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Accepted Price</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #4caf50; font-size: 18px;">${data.price_display}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Route</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup} → ${data.dropoff}</td>
                </tr>
              </table>

              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">Ready to assign a driver!</p>
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/admin/reservation/${data.reservation_id}/edit" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Assign Driver</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'price_set_customer':
      return {
        subject: `💰 Your Transfer Price is Ready - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #fdd835 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #111; margin: 0; font-size: 24px;">💰 Your Transfer Price is Ready</h1>
              <p style="color: #333; margin-top: 10px; font-size: 14px;">Please review and accept your booking</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #fdd835; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <div style="background: #fffde7; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #fdd835;">
                <p style="margin: 0; color: #666; font-size: 14px;">Your Transfer Price</p>
                <p style="margin: 10px 0 0; font-size: 36px; font-weight: bold; color: #111;">${data.price_display}</p>
              </div>

              ${data.passenger_cash_display ? `
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #ffb300;">
                <p style="margin: 0; color: #f57c00; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">💵 CASH PAYMENT TO DRIVER</p>
                <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #e65100;">${data.passenger_cash_display}</p>
                <p style="margin: 8px 0 0; color: #ef6c00; font-size: 13px;">Please pay this amount in cash to your driver at the end of the transfer.</p>
              </div>
              ` : (data.payment_type === 'cash' ? `
              <div style="background: #fff8e1; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #ffb300;">
                <p style="margin: 0; color: #f57c00; font-size: 14px; font-weight: bold;">💵 Cash Payment to Driver</p>
                <p style="margin: 8px 0 0; color: #e65100; font-size: 13px;">Please pay <strong>${data.price_display}</strong> in cash to your driver at the end of the transfer.</p>
              </div>
              ` : '')}

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Pick-up</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Drop-off</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Vehicle</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${getVehicleLabel(data.vehicle_type)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Payment Method</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.payment_type === 'cash' ? '💵 Cash to Driver' : '💳 Online Payment'}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${baseUrl}/customer/reservation/${data.reservation_id}" style="display: inline-block; background: #4caf50; color: #fff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Reservation & Accept Price</a>
              </div>

              <p style="text-align: center; margin-top: 20px; color: #888; font-size: 13px;">
                Click the button above to review and accept your transfer price.
              </p>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>If you have questions, contact us via WhatsApp.</p>
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'driver_assigned_driver':
      return {
        subject: `🚗 Yeni Transfer Görevi - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🚗 Yeni Transfer Görevi</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Size yeni bir transfer atandı</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Rezervasyon Kodu</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #2196f3; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              ${data.passenger_cash_display ? `
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #ffb300;">
                <p style="margin: 0; color: #f57c00; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">💵 YOLCUDAN ALINACAK NAKİT</p>
                <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #e65100;">${data.passenger_cash_display}</p>
                <p style="margin: 8px 0 0; color: #ef6c00; font-size: 13px;">Transfer sonunda müşteriden nakit olarak tahsil edilecek</p>
              </div>
              ` : (data.payment_type === 'cash' ? `
              <div style="background: #fff8e1; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #ffb300;">
                <p style="margin: 0; color: #f57c00; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">💵 YOLCUDAN ALINACAK NAKİT</p>
                <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #e65100;">${data.price_display}</p>
                <p style="margin: 8px 0 0; color: #ef6c00; font-size: 13px;">Transfer sonunda müşteriden nakit olarak tahsil edilecek</p>
              </div>
              ` : `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #2196f3;">
                <p style="margin: 0; color: #1565c0; font-size: 14px;">💳 Online Ödeme - Nakit almayınız</p>
              </div>
              `)}

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Tarih & Saat</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #d32f2f;">${data.pickup_date} - ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Alış Noktası</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Bırakış Noktası</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Araç Tipi</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${getVehicleLabel(data.vehicle_type)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Yolcular</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.passengers}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Ödeme Yöntemi</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.payment_type === 'cash' ? '💵 Nakit' : '💳 Online'}</td>
                </tr>
                ${data.driver_notes ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Notlar</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.driver_notes}</td>
                </tr>
                ` : ''}
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${baseUrl}/driver/job/${data.reservation_id}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Görevi Görüntüle</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'payment_request_customer':
      return {
        subject: `💳 Payment Required - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">💳 Complete Your Payment</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Your transfer price is ready</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #2196f3; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #2196f3;">
                <p style="margin: 0; color: #666; font-size: 14px;">Amount Due</p>
                <p style="margin: 10px 0 0; font-size: 36px; font-weight: bold; color: #1565c0;">${data.price_display}</p>
              </div>

              <p style="text-align: center; color: #666; margin-bottom: 25px;">
                Please complete your payment using the secure link below to confirm your transfer booking.
              </p>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Pick-up</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Drop-off</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Vehicle</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${getVehicleLabel(data.vehicle_type)}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${data.payment_link}" style="display: inline-block; background: #4caf50; color: #fff; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">👉 Pay Now</a>
              </div>

              <p style="text-align: center; margin-top: 20px; color: #888; font-size: 13px;">
                Click the button above to complete your secure payment.
              </p>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>If you have questions, contact us via WhatsApp.</p>
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'payment_confirmed_customer':
      return {
        subject: `✅ Payment Confirmed - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Payment Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Thank you for your payment</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #4caf50; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: bold;">✓ Payment Received</p>
                <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold; color: #1b5e20;">${data.price_display}</p>
                <p style="margin: 10px 0 0; color: #388e3c; font-size: 14px;">Status: <strong>PAID</strong></p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Pick-up</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Drop-off</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Vehicle</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${getVehicleLabel(data.vehicle_type)}</td>
                </tr>
              </table>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Your booking is confirmed! We will assign a driver and notify you before pickup.
                </p>
              </div>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${baseUrl}/customer/reservations" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View My Reservations</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>Thank you for choosing Meet Transfer!</p>
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'price_rejected_admin':
      return {
        subject: `❌ Price Rejected - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">❌ Price Rejected</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Customer declined the price</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #f44336; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Rejected Price</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #f44336;">${data.price_display}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Route</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup} → ${data.dropoff}</td>
                </tr>
              </table>

              <div style="background: #ffebee; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #c62828;">Customer has rejected the offered price.</p>
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/admin/reservations" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Reservations</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'trip_completed_admin':
      return {
        subject: `✅ Trip Completed - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Trip Completed</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Driver has completed the transfer</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #4caf50; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Driver</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.driver_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Route</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup} → ${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Price</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #4caf50;">${data.price_display}</td>
                </tr>
              </table>

              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">Trip successfully completed!</p>
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/admin/monthly-accounting" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Accounting</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'reservation_edited_admin':
      return {
        subject: `✏️ Reservation Modified - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✏️ Reservation Modified</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Customer has made changes to a confirmed reservation</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #ff9800; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Pick-up</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Drop-off</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.dropoff}</td>
                </tr>
              </table>

              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #e65100; font-weight: bold;">⚠️ Requires your review</p>
                <p style="margin: 8px 0 0; color: #f57c00; font-size: 13px;">Please review and approve or reject the changes.</p>
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/admin/reservation/${data.reservation_id}/edit" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Review Changes</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'reservation_cancelled_admin':
      return {
        subject: `🚫 Reservation Cancelled - ${data.reservation_code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #9e9e9e 0%, #616161 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🚫 Reservation Cancelled</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Customer has cancelled their booking</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reservation Code</p>
                <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #9e9e9e; letter-spacing: 3px;">${data.reservation_code}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Customer Name</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Phone</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.customer_phone}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date & Time</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup_date} at ${data.pickup_time}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Route</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.pickup} → ${data.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Price</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${data.price_display}</td>
                </tr>
              </table>

              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0; color: #616161;">This reservation has been cancelled by the customer.</p>
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/admin/reservations" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Reservations</a>
              </div>

              <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                <p>© 2025 Meet Transfer. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, reservation_id, additional_data }: EmailRequest = await req.json();

    if (!type || !reservation_id) {
      throw new Error("type and reservation_id are required");
    }

    console.log(`Sending ${type} email for reservation:`, reservation_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reservation details
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        drivers (id, name, phone, plate_number, vehicle_model, user_id)
      `)
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Reservation not found: " + fetchError?.message);
    }

    // Get customer email
    let customerEmail = "";
    if (reservation.customer_id) {
      const { data: { user } } = await supabase.auth.admin.getUserById(reservation.customer_id);
      customerEmail = user?.email || "";
    }

    // Get driver email if needed
    let driverEmail = "";
    if (type === 'driver_assigned_driver') {
      console.log('=== DRIVER EMAIL LOOKUP START ===');
      console.log('Reservation ID:', reservation_id);
      console.log('Driver ID from reservation:', reservation.driver_id);
      console.log('Driver data from reservation.drivers:', JSON.stringify(reservation.drivers));
      
      if (reservation.drivers?.user_id) {
        console.log('Driver user_id found:', reservation.drivers.user_id);
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reservation.drivers.user_id);
          console.log('Auth getUserById result - userData:', JSON.stringify(userData));
          console.log('Auth getUserById result - error:', JSON.stringify(userError));
          
          if (userError) {
            console.error('Error fetching driver user from auth:', userError.message);
          } else if (userData?.user?.email) {
            driverEmail = userData.user.email;
            console.log('SUCCESS: Found driver email from auth:', driverEmail);
          } else {
            console.log('WARNING: No email in userData:', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('Exception fetching driver email:', e);
        }
      } else {
        console.log('WARNING: No user_id in reservation.drivers');
      }
      
      // Fallback to additional_data if still no email
      if (!driverEmail && additional_data?.driver_email) {
        driverEmail = additional_data.driver_email;
        console.log('FALLBACK: Using driver email from additional_data:', driverEmail);
      }
      
      console.log('=== DRIVER EMAIL LOOKUP END === Final email:', driverEmail || 'NONE');
    }

    // Prepare common data
    const currencySymbol = currencySymbols[reservation.price_currency || 'TRY'] || '';
    const priceDisplay = reservation.price ? `${currencySymbol}${reservation.price}` : '-';
    const passengers = reservation.passenger_names?.length > 0 
      ? reservation.passenger_names.join(', ')
      : reservation.customer_name;

    // Prepare passenger cash display
    const passengerCashCurrencySymbol = currencySymbols[reservation.passenger_cash_currency || 'TRY'] || '';
    const passengerCashDisplay = reservation.passenger_cash_amount 
      ? `${passengerCashCurrencySymbol}${reservation.passenger_cash_amount}` 
      : null;

    const templateData = {
      reservation_id: reservation.id,
      reservation_code: reservation.reservation_code || 'N/A',
      customer_name: reservation.customer_name,
      customer_email: customerEmail,
      customer_phone: reservation.customer_phone,
      pickup: reservation.pickup,
      dropoff: reservation.dropoff,
      pickup_date: reservation.pickup_date,
      pickup_time: reservation.pickup_time,
      vehicle_type: reservation.vehicle_type,
      payment_type: reservation.payment_type,
      passengers: passengers,
      price_display: priceDisplay,
      driver_notes: reservation.driver_notes,
      payment_link: additional_data?.payment_link || reservation.payment_link || '',
      passenger_cash_display: passengerCashDisplay,
      driver_name: reservation.drivers?.name || additional_data?.driver_name || null,
    };

    const template = getEmailTemplate(type, templateData);

    // Determine recipient
    let recipient = "";
    switch (type) {
      case 'new_reservation_admin':
      case 'price_accepted_admin':
      case 'price_rejected_admin':
      case 'trip_completed_admin':
      case 'reservation_edited_admin':
      case 'reservation_cancelled_admin':
        recipient = "info@meettransfer.app";
        break;
      case 'price_set_customer':
      case 'payment_request_customer':
      case 'payment_confirmed_customer':
        recipient = customerEmail;
        break;
      case 'driver_assigned_driver':
        recipient = driverEmail;
        break;
    }

    if (!recipient) {
      console.log(`No recipient email found for ${type}`);
      return new Response(
        JSON.stringify({ success: false, message: "No recipient email found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending email to: ${recipient}`);

    // Note: Using onboarding@resend.dev only works for sending to your own email.
    // To send to other recipients, verify your domain at resend.com/domains
    // and change from address to something like: noreply@meettransfer.app
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <no-reply@mail.meettransfer.app>",
        reply_to: "info@meettransfer.app",
        to: [recipient],
        subject: template.subject,
        html: template.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log(`Email sent successfully to ${recipient}:`, emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
