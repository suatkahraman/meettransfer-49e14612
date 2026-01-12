import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  customerId: string;
  reservationCode: string;
  oldStatus: string;
  newStatus: string;
  pickup?: string;
  dropoff?: string;
  pickupDate?: string;
  pickupTime?: string;
  language?: string;
}

// Status translations
const getStatusTranslation = (status: string, language: string): string => {
  const translations: Record<string, Record<string, string>> = {
    pending: { TR: "Beklemede", EN: "Pending", DE: "Ausstehend", RU: "Ожидание", AR: "قيد الانتظار", FR: "En attente", ES: "Pendiente", IT: "In sospeso", ZH: "待处理", JA: "保留中" },
    confirmed: { TR: "Onaylandı", EN: "Confirmed", DE: "Bestätigt", RU: "Подтверждено", AR: "تم التأكيد", FR: "Confirmé", ES: "Confirmado", IT: "Confermato", ZH: "已确认", JA: "確認済み" },
    cancelled: { TR: "İptal Edildi", EN: "Cancelled", DE: "Storniert", RU: "Отменено", AR: "ملغى", FR: "Annulé", ES: "Cancelado", IT: "Annullato", ZH: "已取消", JA: "キャンセル済み" },
    completed: { TR: "Tamamlandı", EN: "Completed", DE: "Abgeschlossen", RU: "Завершено", AR: "مكتمل", FR: "Terminé", ES: "Completado", IT: "Completato", ZH: "已完成", JA: "完了" },
    in_progress: { TR: "Yolda", EN: "In Progress", DE: "Unterwegs", RU: "В пути", AR: "قيد التنفيذ", FR: "En cours", ES: "En progreso", IT: "In corso", ZH: "进行中", JA: "進行中" },
    driver_assigned: { TR: "Şoför Atandı", EN: "Driver Assigned", DE: "Fahrer zugewiesen", RU: "Водитель назначен", AR: "تم تعيين السائق", FR: "Chauffeur assigné", ES: "Conductor asignado", IT: "Autista assegnato", ZH: "已分配司机", JA: "ドライバー割当済" },
    price_confirmed: { TR: "Fiyat Onaylandı", EN: "Price Confirmed", DE: "Preis bestätigt", RU: "Цена подтверждена", AR: "تم تأكيد السعر", FR: "Prix confirmé", ES: "Precio confirmado", IT: "Prezzo confermato", ZH: "价格已确认", JA: "料金確認済み" },
    customer_approved: { TR: "Müşteri Onayladı", EN: "Customer Approved", DE: "Kunde genehmigt", RU: "Клиент одобрил", AR: "تمت موافقة العميل", FR: "Client approuvé", ES: "Cliente aprobado", IT: "Cliente approvato", ZH: "客户已批准", JA: "顧客承認済み" },
  };
  
  const langKey = language?.toUpperCase() || "EN";
  return translations[status]?.[langKey] || translations[status]?.["EN"] || status;
};

// Get notification message based on status change
const getNotificationMessage = (oldStatus: string, newStatus: string, reservationCode: string, language: string): { title: string; body: string } => {
  const lang = language?.toUpperCase() || "EN";
  const newStatusText = getStatusTranslation(newStatus, lang);
  
  const messages: Record<string, Record<string, { title: string; body: string }>> = {
    confirmed: {
      TR: { title: "🎉 Rezervasyon Onaylandı!", body: `${reservationCode} kodlu rezervasyonunuz onaylandı.` },
      EN: { title: "🎉 Reservation Confirmed!", body: `Your reservation ${reservationCode} has been confirmed.` },
      DE: { title: "🎉 Reservierung Bestätigt!", body: `Ihre Reservierung ${reservationCode} wurde bestätigt.` },
      RU: { title: "🎉 Бронирование Подтверждено!", body: `Ваше бронирование ${reservationCode} подтверждено.` },
      AR: { title: "🎉 تم تأكيد الحجز!", body: `تم تأكيد حجزك ${reservationCode}.` },
      FR: { title: "🎉 Réservation Confirmée!", body: `Votre réservation ${reservationCode} a été confirmée.` },
      ES: { title: "🎉 Reserva Confirmada!", body: `Su reserva ${reservationCode} ha sido confirmada.` },
      IT: { title: "🎉 Prenotazione Confermata!", body: `La tua prenotazione ${reservationCode} è stata confermata.` },
      ZH: { title: "🎉 预订已确认!", body: `您的预订 ${reservationCode} 已确认。` },
      JA: { title: "🎉 予約確認済み!", body: `予約 ${reservationCode} が確認されました。` },
    },
    driver_assigned: {
      TR: { title: "🚗 Şoför Atandı!", body: `${reservationCode} kodlu rezervasyonunuza şoför atandı.` },
      EN: { title: "🚗 Driver Assigned!", body: `A driver has been assigned to your reservation ${reservationCode}.` },
      DE: { title: "🚗 Fahrer Zugewiesen!", body: `Ihrer Reservierung ${reservationCode} wurde ein Fahrer zugewiesen.` },
      RU: { title: "🚗 Водитель Назначен!", body: `Водитель назначен для вашего бронирования ${reservationCode}.` },
      AR: { title: "🚗 تم تعيين السائق!", body: `تم تعيين سائق لحجزك ${reservationCode}.` },
      FR: { title: "🚗 Chauffeur Assigné!", body: `Un chauffeur a été assigné à votre réservation ${reservationCode}.` },
      ES: { title: "🚗 Conductor Asignado!", body: `Se ha asignado un conductor a su reserva ${reservationCode}.` },
      IT: { title: "🚗 Autista Assegnato!", body: `Un autista è stato assegnato alla tua prenotazione ${reservationCode}.` },
      ZH: { title: "🚗 已分配司机!", body: `您的预订 ${reservationCode} 已分配司机。` },
      JA: { title: "🚗 ドライバー割当済み!", body: `予約 ${reservationCode} にドライバーが割り当てられました。` },
    },
    in_progress: {
      TR: { title: "🚕 Transfer Başladı!", body: `${reservationCode} kodlu transferiniz başladı. Şoförünüz yolda!` },
      EN: { title: "🚕 Transfer Started!", body: `Your transfer ${reservationCode} has started. Your driver is on the way!` },
      DE: { title: "🚕 Transfer Gestartet!", body: `Ihr Transfer ${reservationCode} hat begonnen. Ihr Fahrer ist unterwegs!` },
      RU: { title: "🚕 Трансфер Начался!", body: `Ваш трансфер ${reservationCode} начался. Водитель в пути!` },
      AR: { title: "🚕 بدأ النقل!", body: `بدأ نقلك ${reservationCode}. سائقك في الطريق!` },
      FR: { title: "🚕 Transfert Commencé!", body: `Votre transfert ${reservationCode} a commencé. Votre chauffeur est en route!` },
      ES: { title: "🚕 Traslado Iniciado!", body: `Su traslado ${reservationCode} ha comenzado. ¡Su conductor está en camino!` },
      IT: { title: "🚕 Transfer Iniziato!", body: `Il tuo transfer ${reservationCode} è iniziato. Il tuo autista è in arrivo!` },
      ZH: { title: "🚕 接送已开始!", body: `您的接送 ${reservationCode} 已开始。司机正在路上!` },
      JA: { title: "🚕 送迎開始!", body: `送迎 ${reservationCode} が開始されました。ドライバーが向かっています!` },
    },
    completed: {
      TR: { title: "✅ Transfer Tamamlandı!", body: `${reservationCode} kodlu transferiniz tamamlandı. Bizi tercih ettiğiniz için teşekkürler!` },
      EN: { title: "✅ Transfer Completed!", body: `Your transfer ${reservationCode} is complete. Thank you for choosing us!` },
      DE: { title: "✅ Transfer Abgeschlossen!", body: `Ihr Transfer ${reservationCode} ist abgeschlossen. Danke, dass Sie uns gewählt haben!` },
      RU: { title: "✅ Трансфер Завершен!", body: `Ваш трансфер ${reservationCode} завершен. Спасибо, что выбрали нас!` },
      AR: { title: "✅ اكتمل النقل!", body: `اكتمل نقلك ${reservationCode}. شكرا لاختيارك لنا!` },
      FR: { title: "✅ Transfert Terminé!", body: `Votre transfert ${reservationCode} est terminé. Merci de nous avoir choisis!` },
      ES: { title: "✅ Traslado Completado!", body: `Su traslado ${reservationCode} está completo. ¡Gracias por elegirnos!` },
      IT: { title: "✅ Transfer Completato!", body: `Il tuo transfer ${reservationCode} è completato. Grazie per averci scelto!` },
      ZH: { title: "✅ 接送已完成!", body: `您的接送 ${reservationCode} 已完成。感谢您选择我们!` },
      JA: { title: "✅ 送迎完了!", body: `送迎 ${reservationCode} が完了しました。ご利用ありがとうございます!` },
    },
    cancelled: {
      TR: { title: "❌ Rezervasyon İptal Edildi", body: `${reservationCode} kodlu rezervasyonunuz iptal edildi.` },
      EN: { title: "❌ Reservation Cancelled", body: `Your reservation ${reservationCode} has been cancelled.` },
      DE: { title: "❌ Reservierung Storniert", body: `Ihre Reservierung ${reservationCode} wurde storniert.` },
      RU: { title: "❌ Бронирование Отменено", body: `Ваше бронирование ${reservationCode} было отменено.` },
      AR: { title: "❌ تم إلغاء الحجز", body: `تم إلغاء حجزك ${reservationCode}.` },
      FR: { title: "❌ Réservation Annulée", body: `Votre réservation ${reservationCode} a été annulée.` },
      ES: { title: "❌ Reserva Cancelada", body: `Su reserva ${reservationCode} ha sido cancelada.` },
      IT: { title: "❌ Prenotazione Annullata", body: `La tua prenotazione ${reservationCode} è stata annullata.` },
      ZH: { title: "❌ 预订已取消", body: `您的预订 ${reservationCode} 已取消。` },
      JA: { title: "❌ 予約キャンセル", body: `予約 ${reservationCode} がキャンセルされました。` },
    },
    price_confirmed: {
      TR: { title: "💰 Fiyat Onaylandı!", body: `${reservationCode} kodlu rezervasyonunuzun fiyatı onaylandı.` },
      EN: { title: "💰 Price Confirmed!", body: `The price for your reservation ${reservationCode} has been confirmed.` },
      DE: { title: "💰 Preis Bestätigt!", body: `Der Preis für Ihre Reservierung ${reservationCode} wurde bestätigt.` },
      RU: { title: "💰 Цена Подтверждена!", body: `Цена для вашего бронирования ${reservationCode} подтверждена.` },
      AR: { title: "💰 تم تأكيد السعر!", body: `تم تأكيد سعر حجزك ${reservationCode}.` },
      FR: { title: "💰 Prix Confirmé!", body: `Le prix de votre réservation ${reservationCode} a été confirmé.` },
      ES: { title: "💰 Precio Confirmado!", body: `El precio de su reserva ${reservationCode} ha sido confirmado.` },
      IT: { title: "💰 Prezzo Confermato!", body: `Il prezzo della tua prenotazione ${reservationCode} è stato confermato.` },
      ZH: { title: "💰 价格已确认!", body: `您的预订 ${reservationCode} 的价格已确认。` },
      JA: { title: "💰 料金確認済み!", body: `予約 ${reservationCode} の料金が確認されました。` },
    },
  };
  
  // Default message for status update
  const defaultMessages: Record<string, { title: string; body: string }> = {
    TR: { title: "📋 Rezervasyon Güncellendi", body: `${reservationCode} kodlu rezervasyonunuzun durumu: ${newStatusText}` },
    EN: { title: "📋 Reservation Updated", body: `Your reservation ${reservationCode} status: ${newStatusText}` },
    DE: { title: "📋 Reservierung Aktualisiert", body: `Status Ihrer Reservierung ${reservationCode}: ${newStatusText}` },
    RU: { title: "📋 Бронирование Обновлено", body: `Статус вашего бронирования ${reservationCode}: ${newStatusText}` },
    AR: { title: "📋 تم تحديث الحجز", body: `حالة حجزك ${reservationCode}: ${newStatusText}` },
    FR: { title: "📋 Réservation Mise à Jour", body: `Statut de votre réservation ${reservationCode}: ${newStatusText}` },
    ES: { title: "📋 Reserva Actualizada", body: `Estado de su reserva ${reservationCode}: ${newStatusText}` },
    IT: { title: "📋 Prenotazione Aggiornata", body: `Stato della tua prenotazione ${reservationCode}: ${newStatusText}` },
    ZH: { title: "📋 预订已更新", body: `您的预订 ${reservationCode} 状态: ${newStatusText}` },
    JA: { title: "📋 予約更新", body: `予約 ${reservationCode} のステータス: ${newStatusText}` },
  };
  
  return messages[newStatus]?.[lang] || messages[newStatus]?.["EN"] || defaultMessages[lang] || defaultMessages["EN"];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: NotifyRequest = await req.json();
    
    console.log("Notifying customer of reservation status change:", requestData);

    const { customerId, reservationCode, oldStatus, newStatus, language } = requestData;

    if (!customerId || !reservationCode || !newStatus) {
      throw new Error("Missing required fields: customerId, reservationCode, newStatus");
    }

    // Skip if status hasn't actually changed
    if (oldStatus === newStatus) {
      console.log("Status unchanged, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Status unchanged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get notification message
    const { title, body } = getNotificationMessage(oldStatus, newStatus, reservationCode, language || "EN");
    
    console.log(`Sending notification: ${title} - ${body}`);

    // Create in-app notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: customerId,
        title: title,
        message: body,
        type: "reservation_status",
        reservation_id: null, // We don't have the ID here, just the code
      });

    if (notifError) {
      console.error("Failed to create in-app notification:", notifError);
    } else {
      console.log("In-app notification created successfully");
    }

    // Send push notification
    try {
      const { data: pushResult, error: pushError } = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: customerId,
          title: title,
          body: body,
          url: "/customer/bookings",
        },
      });

      if (pushError) {
        console.error("Push notification error:", pushError);
      } else {
        console.log("Push notification sent:", pushResult);
      }
    } catch (pushErr) {
      console.error("Failed to send push notification:", pushErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent",
        title,
        body,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in notify-customer-reservation-status:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
