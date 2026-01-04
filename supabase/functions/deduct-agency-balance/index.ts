import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback exchange rates (TRY based)
const FALLBACK_RATES: Record<string, number> = {
  'EUR': 38.5,
  'USD': 35.5,
  'GBP': 45.0,
  'AED': 9.7,
  'AUD': 23.0,
};

// Get exchange rate from API or fallback
async function getExchangeRate(fromCurrency: string, toCurrency: string = 'TRY'): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates[toCurrency]) {
        console.log(`Exchange rate ${fromCurrency} -> ${toCurrency}: ${data.rates[toCurrency]}`);
        return data.rates[toCurrency];
      }
    }
  } catch (error) {
    console.error('Exchange rate API error:', error);
  }
  
  // Use fallback rate
  const fallbackRate = FALLBACK_RATES[fromCurrency] || 1;
  console.log(`Using fallback rate for ${fromCurrency}: ${fallbackRate}`);
  return fallbackRate;
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

    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing agency balance update for reservation:', reservation_id);

    // Get reservation with agency info
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, agency_id, status, price, price_currency, passenger_cash_amount, passenger_cash_currency, driver_cash_amount')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('Reservation not found:', resError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if no agency linked
    if (!reservation.agency_id) {
      console.log('No agency linked, skipping balance update');
      return new Response(
        JSON.stringify({ message: 'No agency linked to this reservation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency reservation details with amount and currency
    const { data: agencyDetail, error: detailError } = await supabase
      .from('agency_reservation_details')
      .select('company_amount, agency_price_currency')
      .eq('reservation_id', reservation_id)
      .maybeSingle();

    // Admin fiyatı (company_amount) = Acenta'nın gideri = Acenta Geliri for admin
    const adminPrice = agencyDetail?.company_amount || 0;
    const agencyCurrency = agencyDetail?.agency_price_currency || 'EUR';
    
    // Yolcu nakit = Acenta'nın geliri (passenger_cash_amount) - bu acentanın borcundan düşer
    const passengerCashAmount = reservation.passenger_cash_amount || 0;
    const passengerCashCurrency = reservation.passenger_cash_currency || agencyCurrency;

    // Net amount to add to agency debt:
    // Gider (admin fiyatı) - Gelir (yolcu nakit) = Net borç artışı
    const netAmountToAdd = Math.max(0, adminPrice - passengerCashAmount);

    console.log(`Admin Price (expense): ${adminPrice} ${agencyCurrency}, Passenger cash (income): ${passengerCashAmount}, Net debt to add: ${netAmountToAdd}`);

    // === DRIVER BALANCE DEDUCTION ===
    // Şoförün topladığı nakit tutarı şoförün alacağından düşülecek
    const driverCashCollected = reservation.driver_cash_amount || 0;
    const driverCashCurrency = reservation.passenger_cash_currency || 'TRY';
    
    if (driverCashCollected > 0) {
      // Get driver from reservation
      const { data: resWithDriver } = await supabase
        .from('reservations')
        .select('driver_id')
        .eq('id', reservation_id)
        .single();
      
      if (resWithDriver?.driver_id) {
        // Convert to TRY if needed
        let cashInTRY = driverCashCollected;
        if (driverCashCurrency !== 'TRY') {
          const rate = await getExchangeRate(driverCashCurrency, 'TRY');
          cashInTRY = driverCashCollected * rate;
          console.log(`Converted driver cash ${driverCashCollected} ${driverCashCurrency} to ${cashInTRY} TRY (rate: ${rate})`);
        }
        
        // Get or create driver balance
        const { data: existingBalance } = await supabase
          .from('driver_balances')
          .select('id, balance')
          .eq('driver_id', resWithDriver.driver_id)
          .maybeSingle();
        
        if (existingBalance) {
          // Deduct cash from driver balance (cash collected reduces what company owes driver)
          const newBalance = existingBalance.balance - cashInTRY;
          await supabase
            .from('driver_balances')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', existingBalance.id);
          console.log(`Deducted ${cashInTRY} TRY from driver balance. Old: ${existingBalance.balance}, New: ${newBalance}`);
        } else {
          // Create new balance record with negative amount (driver owes company)
          await supabase
            .from('driver_balances')
            .insert({ 
              driver_id: resWithDriver.driver_id, 
              balance: -cashInTRY 
            });
          console.log(`Created driver balance with -${cashInTRY} TRY`);
        }
      }
    }
    // === END DRIVER BALANCE DEDUCTION ===

    if (netAmountToAdd <= 0) {
      console.log('No amount to add to agency balance (passenger cash covers the price)');
      return new Response(
        JSON.stringify({ 
          message: 'No amount to add - passenger cash covers the price',
          admin_price: adminPrice,
          passenger_cash: passengerCashAmount,
          net_debt: 0,
          driver_cash_deducted: driverCashCollected
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency info
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, agency_name')
      .eq('id', reservation.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error('Agency not found:', agencyError);
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate current balance for this specific currency from transactions
    const { data: existingTransactions } = await supabase
      .from('agency_transactions')
      .select('amount, type, currency')
      .eq('agency_id', agency.id)
      .eq('currency', agencyCurrency);

    let currentCurrencyBalance = 0;
    if (existingTransactions) {
      existingTransactions.forEach(tx => {
        if (tx.type === 'top_up') {
          currentCurrencyBalance += tx.amount;
        } else {
          currentCurrencyBalance -= Math.abs(tx.amount);
        }
      });
    }

    // New balance for this currency after adding the net amount
    const newCurrencyBalance = currentCurrencyBalance + netAmountToAdd;

    // Get currency symbol for description
    const currencySymbols: Record<string, string> = {
      'TRY': '₺',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'AED': 'د.إ'
    };
    const currencySymbol = currencySymbols[agencyCurrency] || agencyCurrency;
    const passengerCashSymbol = currencySymbols[passengerCashCurrency] || passengerCashCurrency;

    // Create transaction record with detailed description and currency
    let description = `Transfer tamamlandı - Gider: ${currencySymbol}${adminPrice.toFixed(2)}`;
    if (passengerCashAmount > 0) {
      description += ` | Gelir (Yolcu nakit): ${passengerCashSymbol}${passengerCashAmount.toFixed(2)}`;
      description += ` | Net Borç: ${currencySymbol}${netAmountToAdd.toFixed(2)}`;
    }

    const { error: txError } = await supabase
      .from('agency_transactions')
      .insert({
        agency_id: agency.id,
        amount: netAmountToAdd,
        type: 'reservation_completed',
        description: description,
        balance_after: newCurrencyBalance,
        reservation_id: reservation_id,
        currency: agencyCurrency,
      });

    if (txError) {
      console.error('Failed to create transaction:', txError);
    }

    console.log(`Added net ${currencySymbol}${netAmountToAdd} (${agencyCurrency}) to ${agency.agency_name}. Admin price: ${adminPrice}, Passenger cash: ${passengerCashAmount}, New ${agencyCurrency} balance: ${newCurrencyBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        admin_price: adminPrice,
        passenger_cash_amount: passengerCashAmount,
        net_added_amount: netAmountToAdd,
        currency: agencyCurrency,
        new_currency_balance: newCurrencyBalance,
        agency_name: agency.agency_name,
        driver_cash_deducted: driverCashCollected
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});