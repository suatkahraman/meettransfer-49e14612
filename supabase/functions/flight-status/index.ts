import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightData {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    iata: string;
    timezone: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    delay: number | null;
  };
  arrival: {
    airport: string;
    iata: string;
    timezone: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    delay: number | null;
  };
  airline: {
    name: string;
    iata: string;
  };
  flight: {
    number: string;
    iata: string;
  };
}

interface AviationStackResponse {
  data: FlightData[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightNumber, date } = await req.json();
    
    if (!flightNumber) {
      return new Response(
        JSON.stringify({ error: 'Flight number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('AVIATIONSTACK_API_KEY');
    if (!apiKey) {
      console.error('AVIATIONSTACK_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Flight tracking service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the flight number (remove spaces)
    const cleanFlightNumber = flightNumber.replace(/\s+/g, '').toUpperCase();
    
    console.log(`Fetching flight status for: ${cleanFlightNumber}, date: ${date || 'today'}`);

    // Build API URL
    // Note: AviationStack free tier only supports HTTP (not HTTPS)
    let apiUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${cleanFlightNumber}`;
    
    // Add date filter if provided
    if (date) {
      apiUrl += `&flight_date=${date}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('AviationStack API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flight status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: AviationStackResponse = await response.json();
    
    console.log(`Found ${data.data?.length || 0} flights for ${cleanFlightNumber}`);

    if (!data.data || data.data.length === 0) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'No flight data found for this flight number' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent/relevant flight
    const flight = data.data[0];
    
    // Format the response
    const flightStatus = {
      found: true,
      flightNumber: flight.flight.iata,
      airline: flight.airline.name,
      status: flight.flight_status,
      date: flight.flight_date,
      departure: {
        airport: flight.departure.airport,
        iata: flight.departure.iata,
        scheduled: flight.departure.scheduled,
        estimated: flight.departure.estimated,
        actual: flight.departure.actual,
        delay: flight.departure.delay,
      },
      arrival: {
        airport: flight.arrival.airport,
        iata: flight.arrival.iata,
        scheduled: flight.arrival.scheduled,
        estimated: flight.arrival.estimated,
        actual: flight.arrival.actual,
        delay: flight.arrival.delay,
      },
    };

    console.log('Flight status:', JSON.stringify(flightStatus));

    return new Response(
      JSON.stringify(flightStatus),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in flight-status function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
