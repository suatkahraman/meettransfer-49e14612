/**
 * Gemini API - Hata ayrıştırma ve kullanıcıya anlamlı mesaj gösterme.
 * Özellikle IP kısıtlaması (403) ve diğer yaygın hatalar için rehberlik.
 */

export type GeminiErrorLang = 'TR' | 'EN';

/**
 * Gemini API hata yanıtını parse eder ve kullanıcı dostu mesaj döner.
 * Google'ın döndüğü JSON: { error: { code, message, status } }
 */
export function parseGeminiError(
  status: number,
  errText: string,
  lang: GeminiErrorLang
): string {
  let rawMessage = '';
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string; code?: number; status?: string } };
    rawMessage = (parsed?.error?.message || '').toLowerCase();
  } catch {
    rawMessage = errText.toLowerCase();
  }

  const isIp =
    rawMessage.includes('ip address') ||
    rawMessage.includes('ip_address') ||
    rawMessage.includes('ip restriction') ||
    rawMessage.includes('ip addresses') ||
    rawMessage.includes('blocked') ||
    (status === 403 && rawMessage.includes('ip'));

  const isQuota =
    rawMessage.includes('quota') ||
    rawMessage.includes('exceeded') ||
    rawMessage.includes('rate limit') ||
    status === 429;

  const isInvalidKey =
    rawMessage.includes('invalid') ||
    rawMessage.includes('api key') ||
    rawMessage.includes('api_key') ||
    rawMessage.includes('api key not valid') ||
    status === 401;

  if (isIp) {
    return lang === 'TR'
      ? 'API anahtarınızda IP adresi kısıtlaması var. Bu web uygulaması kullanıcıların tarayıcısından Gemini\'ye istek atıyor. Çözüm: Google AI Studio veya Cloud Console → API Keys → İlgili anahtar → "Application restrictions" bölümünde "None" seçin veya "IP addresses" kısıtlamasını kaldırın.'
      : 'Your API key has IP address restrictions. This web app calls Gemini from users\' browsers. Fix: Google AI Studio or Cloud Console → API Keys → Select your key → Under "Application restrictions" choose "None" or remove "IP addresses" restriction.';
  }

  if (isQuota) {
    return lang === 'TR'
      ? 'Gemini API kota limiti aşıldı. Lütfen daha sonra tekrar deneyin veya Google AI Studio\'da kotayı kontrol edin.'
      : 'Gemini API quota exceeded. Please try again later or check quota in Google AI Studio.';
  }

  if (isInvalidKey) {
    return lang === 'TR'
      ? 'Geçersiz veya eksik API anahtarı. Vercel Environment Variables\'da VITE_GEMINI_API_KEY değerini kontrol edin. Yeni anahtar: aistudio.google.com/app/apikey'
      : 'Invalid or missing API key. Check VITE_GEMINI_API_KEY in Vercel Environment Variables. New key: aistudio.google.com/app/apikey';
  }

  if (status === 403) {
    return lang === 'TR'
      ? 'Erişim engellendi (403). API anahtarında kısıtlama olabilir. Cloud Console\'da "Application restrictions" → "None" seçin.'
      : 'Access denied (403). Your API key may have restrictions. In Cloud Console set "Application restrictions" → "None".';
  }

  return lang === 'TR'
    ? `Asistan şu an yanıt veremiyor (${status}). Lütfen API anahtarınızı ve kısıtlamaları kontrol edin.`
    : `Assistant unavailable (${status}). Please check your API key and restrictions.`;
}
