import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Meet Transfer's Google Place ID - Get this from Google Business Profile
const PLACE_ID = "ChIJxWLW5C_byxQRxSUmLFnp2dU";

// Cache duration in hours
const CACHE_DURATION_HOURS = 24;

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
  time: number;
}

interface PlaceDetailsResponse {
  result?: {
    reviews?: GoogleReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get language from request body or default to 'en'
    let language = 'en';
    let forceRefresh = false;
    try {
      const body = await req.json();
      language = body.language?.toLowerCase() || 'en';
      forceRefresh = body.forceRefresh || false;
    } catch {
      // No body, use defaults
    }

    console.log(`Fetching reviews for language: ${language}, forceRefresh: ${forceRefresh}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('google_reviews_cache')
        .select('*')
        .eq('language', language)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!cacheError && cachedData) {
        // Always prefer a canonical rating/count from EN cache if present,
        // so all locales show the same numbers.
        const { data: canonical } = await supabase
          .from('google_reviews_cache')
          .select('rating,total_reviews')
          .eq('language', 'en')
          .single();

        const canonicalRating = canonical?.rating ?? cachedData.rating;
        const canonicalTotal = canonical?.total_reviews ?? cachedData.total_reviews;

        console.log('Returning cached reviews');
        return new Response(
          JSON.stringify({
            reviews: cachedData.reviews,
            rating: canonicalRating,
            totalReviews: canonicalTotal,
            cached: true,
            cachedAt: cachedData.fetched_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No valid cache, fetch from Google Places API
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', reviews: [], rating: 0, totalReviews: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching fresh reviews from Google Places API for place: ${PLACE_ID}`);

    // Fetch place details including reviews
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=${language}&reviews_sort=newest`;
    
    const response = await fetch(url);
    const data: PlaceDetailsResponse = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.error_message || data.status);
      
      // Try to return stale cache if available
      const { data: staleCache } = await supabase
        .from('google_reviews_cache')
        .select('*')
        .eq('language', language)
        .single();
      
      if (staleCache) {
        console.log('Returning stale cache due to API error');
        return new Response(
          JSON.stringify({
            reviews: staleCache.reviews,
            rating: staleCache.rating,
            totalReviews: staleCache.total_reviews,
            cached: true,
            stale: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: data.error_message || data.status, 
          reviews: [], 
          rating: 0, 
          totalReviews: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reviews = data.result?.reviews?.map((review) => ({
      name: review.author_name,
      rating: review.rating,
      text: review.text,
      date: review.relative_time_description,
      avatar: review.profile_photo_url,
      timestamp: review.time,
    })) || [];

    const rating = data.result?.rating || 0;
    const totalReviews = data.result?.user_ratings_total || 0;

    console.log(`Fetched ${reviews.length} reviews, caching...`);

    // Update cache (upsert based on language)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

    const nowIso = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('google_reviews_cache')
      .upsert(
        {
          language,
          reviews,
          rating,
          total_reviews: totalReviews,
          fetched_at: nowIso,
          expires_at: expiresAt.toISOString(),
          updated_at: nowIso,
        },
        {
          onConflict: 'language',
        }
      );

    // Keep rating/count synchronized across all cached languages to prevent
    // different pages/locales showing different numbers.
    const { error: syncError } = await supabase
      .from('google_reviews_cache')
      .update({ rating, total_reviews: totalReviews, updated_at: nowIso })
      .neq('language', language);

    if (upsertError) {
      console.error('Error caching reviews:', upsertError);
    } else if (syncError) {
      console.error('Error syncing rating across languages:', syncError);
    } else {
      console.log('Reviews cached successfully');
    }

    return new Response(
      JSON.stringify({
        reviews,
        rating,
        totalReviews,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Google reviews:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, reviews: [], rating: 0, totalReviews: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
