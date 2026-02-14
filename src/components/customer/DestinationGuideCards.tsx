/**
 * Akıllı Rehber Kartları - Varış noktasına göre filtrelenmiş
 * Hava Durumu, Popüler Restoranlar, Gezilecek Yerler
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, UtensilsCrossed, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function extractLocationFromAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  return (parts[0] || address).trim();
}

async function fetchGuideData(
  apiKey: string,
  destination: string,
  date: string,
  lang: 'TR' | 'EN'
): Promise<{ weather: string; restaurants: string; places: string }> {
  const prompt =
    lang === 'TR'
      ? `${destination} bölgesi için ${date} tarihinde: 1) HAVA DURUMU (kısa, 1-2 cümle), 2) POPÜLER RESTORANLAR (3-4 isim, kısa açıklama), 3) GEZİLECEK YERLER (3-4 yer, kısa açıklama). Her bölümü ayrı paragraf olarak yaz. Format: "HAVA DURUMU:" başlığı altında hava, "RESTORANLAR:" altında restoranlar, "GEZİLECEK YERLER:" altında yerler.`
      : `For ${destination} on ${date}: 1) WEATHER (brief, 1-2 sentences), 2) POPULAR RESTAURANTS (3-4 names, brief), 3) PLACES TO VISIT (3-4 places, brief). Write each as separate paragraph. Format: "WEATHER:" header then weather, "RESTAURANTS:" then restaurants, "PLACES TO VISIT:" then places.`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) throw new Error('Failed to fetch guide data');
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  const sections = {
    weather: '',
    restaurants: '',
    places: '',
  };

  const weatherMatch = text.match(
    /(?:HAVA DURUMU:|WEATHER:)\s*([\s\S]*?)(?=RESTORANLAR:|RESTAURANTS:|$)/i
  );
  const restMatch = text.match(
    /(?:RESTORANLAR:|RESTAURANTS:)\s*([\s\S]*?)(?=GEZİLECEK YERLER:|PLACES TO VISIT:|$)/i
  );
  const placesMatch = text.match(
    /(?:GEZİLECEK YERLER:|PLACES TO VISIT:)\s*([\s\S]*?)$/i
  );

  sections.weather = (weatherMatch?.[1] || '').trim().slice(0, 200);
  sections.restaurants = (restMatch?.[1] || '').trim().slice(0, 300);
  sections.places = (placesMatch?.[1] || '').trim().slice(0, 300);

  return sections;
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

  useEffect(() => {
    if (!loc) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!GEMINI_API_KEY) {
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
          setWeather(data.weather || '-');
          setRestaurants(data.restaurants || '-');
          setPlaces(data.places || '-');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load');
          setWeather('-');
          setRestaurants('-');
          setPlaces('-');
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

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {/* Hava Durumu */}
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardHeader className="pb-2 pt-4 px-4 bg-gradient-to-r from-sky-500/10 to-cyan-500/10">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cloud className="h-4 w-4 text-sky-600" />
            {language === 'TR' ? 'Hava Durumu' : 'Weather'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === 'TR' ? 'Yükleniyor...' : 'Loading...'}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : (
            <p className="text-sm text-foreground">{weather || '-'}</p>
          )}
        </CardContent>
      </Card>

      {/* Popüler Restoranlar */}
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardHeader className="pb-2 pt-4 px-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber-600" />
            {language === 'TR' ? 'Popüler Restoranlar' : 'Popular Restaurants'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === 'TR' ? 'Yükleniyor...' : 'Loading...'}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-line">
              {restaurants || '-'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gezilecek Yerler */}
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardHeader className="pb-2 pt-4 px-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            {language === 'TR' ? 'Gezilecek Yerler' : 'Places to Visit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === 'TR' ? 'Yükleniyor...' : 'Loading...'}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-line">
              {places || '-'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
