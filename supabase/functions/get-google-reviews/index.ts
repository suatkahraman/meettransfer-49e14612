import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Meet Transfer's Google Place ID - Get this from Google Business Profile
const PLACE_ID = "ChIJxWLW5C_byxQRxSUmLFnp2dU";

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
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', reviews: [], rating: 0, totalReviews: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get language from request body or default to 'en'
    let language = 'en';
    try {
      const body = await req.json();
      language = body.language || 'en';
    } catch {
      // No body, use default
    }

    console.log(`Fetching Google reviews for place: ${PLACE_ID}, language: ${language}`);

    // Fetch place details including reviews
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=${language}&reviews_sort=newest`;
    
    const response = await fetch(url);
    const data: PlaceDetailsResponse = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.error_message || data.status);
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

    console.log(`Found ${reviews.length} reviews`);

    return new Response(
      JSON.stringify({
        reviews,
        rating: data.result?.rating || 0,
        totalReviews: data.result?.user_ratings_total || 0,
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
