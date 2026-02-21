-- TRY, GBP, USD için EUR'dan güncel kur ekler/günceller
insert into exchange_rates (from_currency, to_currency, rate, date)
values
  ('EUR', 'TRY', 35.5, now()),
  ('EUR', 'GBP', 1.2, now()),
  ('EUR', 'USD', 1.08, now())
on conflict (from_currency, to_currency)
do update set rate = excluded.rate, date = excluded.date;