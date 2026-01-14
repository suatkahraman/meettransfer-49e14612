import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Input validation
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format");
      return new Response(JSON.stringify({ error: "Invalid request: messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit number of messages to prevent abuse
    const MAX_MESSAGES = 50;
    if (messages.length > MAX_MESSAGES) {
      console.error(`Too many messages: ${messages.length}`);
      return new Response(JSON.stringify({ error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and sanitize each message
    const MAX_MESSAGE_LENGTH = 4000;
    const validRoles = ['user', 'assistant'];
    const sanitizedMessages = [];

    for (const msg of messages) {
      // Validate message structure
      if (!msg || typeof msg !== 'object') {
        console.error("Invalid message object");
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate role
      if (!validRoles.includes(msg.role)) {
        console.error(`Invalid role: ${msg.role}`);
        return new Response(JSON.stringify({ error: "Invalid message role. Must be 'user' or 'assistant'." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate and truncate content
      if (typeof msg.content !== 'string') {
        console.error("Message content must be a string");
        return new Response(JSON.stringify({ error: "Message content must be a string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const content = msg.content.slice(0, MAX_MESSAGE_LENGTH).trim();
      if (!content) {
        continue; // Skip empty messages
      }

      sanitizedMessages.push({
        role: msg.role,
        content: content
      });
    }

    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", sanitizedMessages.length, "validated messages");

    const systemPrompt = `Sen Meet Transfer'ın AI rezervasyon asistanısın. Kısa, net ve doğrudan cevaplar ver.

TEMEL KURALLAR:
- Cevaplarını 2-3 cümle ile sınırla
- Gereksiz açıklama yapma, direkt bilgi ver
- Emoji kullanma
- Fiyat sorulduğunda: "Nereden nereye, kaç kişi?" diye sor
- Bilgileri topladığında hemen rezervasyon formuna yönlendir

REZERVASYON AKIŞI:
1. Nereden (alış noktası)?
2. Nereye (varış noktası)?
3. Tarih ve saat?
4. Kaç yolcu?
5. Dönüş transferi ister misiniz? (Mutlaka sor!)
6. Bilgiler tamam → "Rezervasyonu tamamlamak için lütfen formu doldurun" de ve [FORM_REDIRECT] komutunu ekle

FORM YÖNLENDİRME:
Tüm bilgiler toplandığında şu formatta yanıt ver:
"Bilgilerinizi aldım. Rezervasyonu tamamlamak için formu doldurun. [FORM_REDIRECT]"

HİZMETLER:
- Havalimanı transferi (IST, SAW, AYT, DLM, BJV, ADB)
- Şehirlerarası transfer
- Saatlik kiralama
- Araçlar: Mercedes Vito, VIP Vito, Maybach, Minibüs

KISA CEVAP ÖRNEKLERİ:
- "Antalya havalimanından Belek'e 4 kişi için transfer 35€. Dönüş ister misiniz?"
- "Tarih ve saat nedir?"
- "Kaç kişisiniz?"
- "Dönüş transferi ekleyelim mi? %30 indirimli olur."`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
