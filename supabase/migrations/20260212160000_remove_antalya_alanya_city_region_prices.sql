-- Antalya <-> Alanya should be priced only from intercity_prices.
-- Remove city-level region prices for this route so reservation pricing
-- never falls back to Antalya city pricing entries.
delete from public.region_prices
where lower(city) = 'antalya'
  and position('alanya' in lower(district)) > 0
  and (airport is null or btrim(airport) = '');
