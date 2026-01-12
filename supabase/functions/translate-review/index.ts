import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Simple hash function for cache key
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

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
    const textHash = hashText(text);
    
    console.log(`Translation request for hash ${textHash} to ${target}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cachedTranslation, error: cacheError } = await supabase
      .from('translation_cache')
      .select('translated_text, source_language, hit_count')
      .eq('source_text_hash', textHash)
      .eq('target_language', target)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!cacheError && cachedTranslation) {
      console.log(`Cache hit! Returning cached translation (hits: ${cachedTranslation.hit_count})`);
      
      // Update hit count asynchronously (don't await)
      supabase
        .from('translation_cache')
        .update({ hit_count: cachedTranslation.hit_count + 1 })
        .eq('source_text_hash', textHash)
        .eq('target_language', target)
        .then(() => console.log('Hit count updated'));

      return new Response(
        JSON.stringify({ 
          translatedText: cachedTranslation.translated_text,
          originalText: text,
          sourceLanguage: cachedTranslation.source_language,
          targetLanguage: target,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cache miss. Translating text to ${target}...`);

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
    
    console.log(`Translation successful. Source: ${detectedLanguage}. Caching result...`);

    // Cache the translation (30 day expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: insertError } = await supabase
      .from('translation_cache')
      .upsert({
        source_text_hash: textHash,
        source_text: text.substring(0, 1000), // Limit stored text length
        target_language: target,
        translated_text: translatedText,
        source_language: detectedLanguage,
        expires_at: expiresAt.toISOString(),
        hit_count: 1
      }, {
        onConflict: 'source_text_hash,target_language'
      });

    if (insertError) {
      console.error('Error caching translation:', insertError);
    } else {
      console.log('Translation cached successfully');
    }

    return new Response(
      JSON.stringify({ 
        translatedText,
        originalText: text,
        sourceLanguage: detectedLanguage,
        targetLanguage: target,
        cached: false
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
