import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language codes mapping for Google Translate
const languageMap: Record<string, string> = {
  'en': 'en',
  'tr': 'tr',
  'de': 'de',
  'ru': 'ru',
  'ar': 'ar',
  'fr': 'fr',
  'es': 'es',
  'it': 'it',
  'pt': 'pt',
  'zh': 'zh',
  'ja': 'ja',
  'ko': 'ko',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const target = languageMap[targetLanguage] || 'en';
    
    console.log(`Translating text to ${target}: "${text.substring(0, 50)}..."`);

    // Use Google Translate API (free tier via unofficial endpoint)
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(translateUrl);
    
    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Translation failed', translatedText: text }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract translated text from response
    // Response format: [[["translated text","original text",null,null,10]],null,"en",...]
    let translatedText = '';
    if (data && data[0]) {
      translatedText = data[0].map((item: any[]) => item[0]).join('');
    }

    if (!translatedText) {
      console.log('No translation found, returning original text');
      return new Response(
        JSON.stringify({ translatedText: text, detected: 'unknown' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detected source language
    const detectedLanguage = data[2] || 'unknown';
    
    console.log(`Translation successful. Detected language: ${detectedLanguage}`);

    return new Response(
      JSON.stringify({ 
        translatedText,
        originalText: text,
        sourceLanguage: detectedLanguage,
        targetLanguage: target
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translation error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
