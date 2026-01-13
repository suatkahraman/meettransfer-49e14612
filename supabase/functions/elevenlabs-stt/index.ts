import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, language, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for ElevenLabs transcription, language:', language, 'mimeType:', mimeType);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log('Audio size:', binaryAudio.length, 'bytes');
    
    // Determine file extension and mime type
    const actualMimeType = mimeType || 'audio/webm';
    let fileExtension = 'webm';
    let contentType = 'audio/webm';
    
    if (actualMimeType.includes('mp4') || actualMimeType.includes('m4a')) {
      fileExtension = 'm4a';
      contentType = 'audio/mp4';
    } else if (actualMimeType.includes('mpeg') || actualMimeType.includes('mp3')) {
      fileExtension = 'mp3';
      contentType = 'audio/mpeg';
    } else if (actualMimeType.includes('ogg')) {
      fileExtension = 'ogg';
      contentType = 'audio/ogg';
    } else if (actualMimeType.includes('wav')) {
      fileExtension = 'wav';
      contentType = 'audio/wav';
    } else if (actualMimeType.includes('aac')) {
      fileExtension = 'aac';
      contentType = 'audio/aac';
    }
    
    console.log('Using file extension:', fileExtension, 'content type:', contentType);
    
    // Prepare form data for ElevenLabs Scribe API
    const formData = new FormData();
    const audioArrayBuffer = new ArrayBuffer(binaryAudio.length);
    const audioView = new Uint8Array(audioArrayBuffer);
    audioView.set(binaryAudio);
    const blob = new Blob([audioArrayBuffer], { type: contentType });
    formData.append('file', blob, `audio.${fileExtension}`);
    formData.append('model_id', 'scribe_v1');
    
    // Add language code if provided (ISO 639-3 format for ElevenLabs)
    if (language) {
      const languageMap: Record<string, string> = {
        'TR': 'tur',
        'EN': 'eng',
        'DE': 'deu',
        'FR': 'fra',
        'RU': 'rus',
        'AR': 'ara',
        'ES': 'spa',
        'IT': 'ita',
        'UK': 'ukr',
        'JA': 'jpn'
      };
      if (languageMap[language]) {
        formData.append('language_code', languageMap[language]);
      }
    }

    console.log('Sending request to ElevenLabs Scribe API...');

    // Send to ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT API error:', response.status, errorText);
      throw new Error(`ElevenLabs STT API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Transcription result:', result.text);

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ElevenLabs STT error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
