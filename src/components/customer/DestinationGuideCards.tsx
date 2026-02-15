/**
 * Akıllı Rehber Kartları - Varış noktasına göre filtrelenmiş
 * Hava Durumu, Popüler Restoranlar, Gezilecek Yerler (Gemini AI)
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, MapPin, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseGeminiError } from '@/lib/geminiApi';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || undefined;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function extractLocationFromAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  return (parts[0] || address).trim();
}

/** Parse list items from Gemini text (bullet or numbered list) */
function parseListItems(text: string, maxItems = 4): Array<{ name: string; desc: string }> {
  const lines = (text || '')
    .split(/\n/)
    .map((l) => l.replace(/^[\s\-•\d.)]+/, '').trim())
    .filter((l) => l.length > 2);
  const items: Array<{ name: string; desc: string }> = [];
  for (let i = 0; i < Math.min(lines.length, maxItems); i++) {
    const line = lines[i];
    const dashIdx = line.indexOf(' - ');
    const colonIdx = line.indexOf(': ');
    const sep = dashIdx >= 0 ? dashIdx : colonIdx >= 0 ? colonIdx : -1;
    if (sep >= 0) {
      items.push({
        name: line.slice(0, sep).trim(),
        desc: line.slice(sep + (dashIdx >= 0 ? 3 : 2)).trim().slice(0, 120),
      });
    } else {
      items.push({ name: line.slice(0, 50), desc: '' });
    }
  }
  return items;
}

async function fetchGuideData(
  apiKey: string,
  destination: string,
  date: string,
  lang: 'TR' | 'EN'
): Promise<{ weather: string; restaurants: string; places: string }> {
  const prompt =
    lang === 'TR'
      ? `${destination} bölgesi için ${date} tarihinde kısa ve profesyonel bir rehber yaz.\n\n1) HAVA DURUMU: 1-2 cümle (sıcaklık ve durum).\n2) RESTORANLAR: Her satırda "İsim - kısa açıklama" formatında 3-4 restoran (sadece gerçek, bilinen mekanlar).\n3) GEZİLECEK YERLER: Her satırda "Yer adı - kısa açıklama" formatında 3-4 yer.\n\nBaşlıklar: HAVA DURUMU:, RESTORANLAR:, GEZİLECEK YERLER:`
      : `For ${destination} on ${date}, write a brief professional guide.\n\n1) WEATHER: 1-2 sentences (temperature and conditions).\n2) RESTAURANTS: 3-4 entries, each line "Name - brief description" (real, known places only).\n3) PLACES TO VISIT: 3-4 entries, each line "Place name - brief description".\n\nHeaders: WEATHER:, RESTAURANTS:, PLACES TO VISIT:`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const msg = parseGeminiError(res.status, errText, lang);
    throw new Error(msg);
  }
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  const weatherMatch = text.match(
    /(?:HAVA DURUMU:|WEATHER:)\s*([\s\S]*?)(?=RESTORANLAR:|RESTAURANTS:|$)/i
  );
  const restMatch = text.match(
    /(?:RESTORANLAR:|RESTAURANTS:)\s*([\s\S]*?)(?=GEZİLECEK YERLER:|PLACES TO VISIT:|$)/i
  );
  const placesMatch = text.match(
    /(?:GEZİLECEK YERLER:|PLACES TO VISIT:)\s*([\s\S]*?)$/i
  );

  return {
    weather: (weatherMatch?.[1] || '').trim().slice(0, 220),
    restaurants: (restMatch?.[1] || '').trim(),
    places: (placesMatch?.[1] || '').trim(),
  };
}

interface DestinationGuideCardsProps {
  destination: string;
  date?: string;
  language?: 'TR' | 'EN';
  className?: string;
}

export function DestinationGuideCards({
  destination,
  date,
  language = 'EN',
  className,
}: DestinationGuideCardsProps) {
  const [weather, setWeather] = useState('');
  const [restaurants, setRestaurants] = useState('');
  const [places, setPlaces] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loc = extractLocationFromAddress(destination);
  const displayDate = date || new Date().toISOString().split('T')[0];
  const restaurantItems = parseListItems(restaurants);
  const placeItems = parseListItems(places);

  useEffect(() => {
    if (!loc) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!GEMINI_API_KEY) {
      console.warn('Vite Env Yüklenemedi: VITE_GEMINI_API_KEY undefined veya boş. Vercel: Environment Variables\'da Production/Preview/Development scope kontrol edin.');
      setWeather(
        language === 'TR'
          ? `${loc} için hava durumu bilgisi - Gemini API yapılandırılmamış.`
          : `Weather info for ${loc} - Gemini API not configured.`
      );
      setRestaurants(
        language === 'TR'
          ? 'Restoran önerileri için .env dosyasına VITE_GEMINI_API_KEY ekleyin.'
          : 'Add VITE_GEMINI_API_KEY to .env for restaurant suggestions.'
      );
      setPlaces(
        language === 'TR'
          ? 'Gezilecek yerler için Gemini API anahtarı gerekli.'
          : 'Gemini API key required for places to visit.'
      );
      setLoading(false);
      return;
    }

    fetchGuideData(GEMINI_API_KEY, loc, displayDate, language)
      .then((data) => {
        if (!cancelled) {
          setWeather(data.weather || '');
          setRestaurants(data.restaurants || '');
          setPlaces(data.places || '');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load');
          setWeather('');
          setRestaurants('');
          setPlaces('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loc, displayDate, language]);

  if (!loc) return null;

  const cardBase = 'overflow-hidden rounded-xl border border-border/80 shadow-sm transition-shadow hover:shadow-md';
  const headerBase = 'pb-2 pt-4 px-4 border-b border-border/50';

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {/* Hava Durumu */}
      <Card className={cardBase}>
        <CardHeader className={cn(headerBase, 'bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <ThermometerSun className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            {language === 'TR' ? 'Hava Durumu' : 'Weather'}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{displayDate}</p>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{weather || '-'}</p>
          )}
        </CardContent>
      </Card>

      {/* Popüler Restoranlar */}
      <Card className={cardBase}>
        <CardHeader className={cn(headerBase, 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <UtensilsCrossed className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {language === 'TR' ? 'Popüler Restoranlar' : 'Popular Restaurants'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : restaurantItems.length > 0 ? (
            <ul className="space-y-3">
              {restaurantItems.map((item, i) => (
                <li key={i} className="border-l-2 border-amber-400/60 pl-3 py-0.5">
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                  {item.desc && <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-line">{restaurants || '-'}</p>
          )}
        </CardContent>
      </Card>

      {/* Gezilecek Yerler */}
      <Card className={cardBase}>
        <CardHeader className={cn(headerBase, 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {language === 'TR' ? 'Gezilecek Yerler' : 'Places to Visit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : placeItems.length > 0 ? (
            <ul className="space-y-3">
              {placeItems.map((item, i) => (
                <li key={i} className="border-l-2 border-emerald-400/60 pl-3 py-0.5">
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                  {item.desc && <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-line">{places || '-'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
