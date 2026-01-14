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
    const { text, voiceId, stability, similarityBoost, style, speed, previousText, nextText } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default to a soft, persuasive female voice for booking conversions
    // Sarah - EXAVITQu4vr4xnSDxMaL (warm, professional, multilingual including Turkish)
    // Other great options: 
    // - Lily (pFZP5JQG7iQjIQuC4Bku) - soft, gentle
    // - Jessica (cgSgspJ2msm6clMCkdW9) - natural, conversational
    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';

    // Optimized voice settings for natural, persuasive, human-like speech
    // Higher stability for consistency, moderate style for warmth
    const voiceSettings = {
      stability: typeof stability === 'number' ? stability : 0.65, // More consistent, professional
      similarity_boost: typeof similarityBoost === 'number' ? similarityBoost : 0.80, // Strong voice character
      style: typeof style === 'number' ? style : 0.45, // Warmer, more expressive
      use_speaker_boost: true, // Clearer voice
      speed: typeof speed === 'number' ? speed : 0.95, // Slightly slower for better comprehension
    };

    console.log('Generating speech for text:', text.substring(0, 100), '...');
    console.log('Using voice ID:', selectedVoiceId);
    console.log('Voice settings:', voiceSettings);
    if (previousText) console.log('Previous text context:', previousText.substring(0, 50), '...');
    if (nextText) console.log('Next text context:', nextText.substring(0, 50), '...');

    // Build request body with optional request stitching for natural flow
    const requestBody: Record<string, unknown> = {
      text,
      model_id: 'eleven_multilingual_v2', // Best for Turkish
      voice_settings: voiceSettings,
    };

    // Add request stitching context for natural prosody between sentences
    if (previousText) {
      requestBody.previous_text = previousText;
    }
    if (nextText) {
      requestBody.next_text = nextText;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in elevenlabs-tts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
