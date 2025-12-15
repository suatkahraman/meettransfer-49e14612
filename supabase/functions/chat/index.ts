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

    const systemPrompt = `You are a friendly and helpful customer support assistant for Meet Transfer, a premium airport transfer and chauffeur service in Turkey.

Your role is to:
- Answer questions about our transfer services (airport pickups, private transfers, luxury chauffeur)
- Provide information about destinations we serve: Istanbul (IST/SAW airports), Antalya, Bodrum, Dalaman, Izmir, and Cappadocia
- Help with booking inquiries and pricing questions
- Explain our vehicle options: Mercedes Vito, Mercedes Vip Vito, Maybach, and Minibus
- Address concerns about safety, reliability, and service quality

Key information:
- We offer 24/7 airport transfers with flight tracking
- Professional English-speaking drivers
- All-inclusive pricing with no hidden fees
- Free cancellation up to 24 hours before pickup
- Child seats available on request

Be concise, professional, and helpful. If asked about specific prices, suggest they check our website or contact us via WhatsApp for accurate quotes. Always be warm and welcoming.`;

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
