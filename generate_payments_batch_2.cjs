const fs = require('fs');

// Raw data from user (copy-pasted)
const rawDataChunk = `{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":35,""company_amount_try"":null,""conversion_date"":""2026-01-23"",""created_at"":""2026-01-23T15:39:59.529003+00:00"",""customer_price"":35,""exchange_rate_used"":50.908,""id"":""5e22bba6-ab33-40cc-b96a-b3687f303a2d"",""payment_status"":""not_paid"",""reservation_id"":""fa9bf294-5999-4578-95d0-45dc8f1561cb"",""updated_at"":""2026-01-26T07:01:53.627562+00:00""},{""agency_notes"":null,""agency_price_currency"":""USD"",""agency_profit"":60,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":""2026-01-26"",""created_at"":""2026-01-25T09:11:19.580124+00:00"",""customer_price"":60,""exchange_rate_used"":43.376,""id"":""a96e7c6c-027a-4a54-ae80-3f037fd7d2b0"",""payment_status"":""not_paid"",""reservation_id"":""7b6625bf-c009-4de3-84de-b7f88d4248bc"",""updated_at"":""2026-01-26T15:56:30.321573+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":296,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-04T06:22:17.840854+00:00"",""customer_price"":296,""exchange_rate_used"":null,""id"":""406db1ab-9ff0-4068-9f70-4d8d24e65722"",""payment_status"":""not_paid"",""reservation_id"":""bbbc64aa-f9ea-42ab-855c-cfe69ef46c2f"",""updated_at"":""2026-02-16T17:31:47.684907+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":2200,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-01-23T10:52:31.742251+00:00"",""customer_price"":2200,""exchange_rate_used"":null,""id"":""303d025d-c014-46a9-9fd2-41edd92d8752"",""payment_status"":""not_paid"",""reservation_id"":""0b9159c9-2d21-43be-a6bf-03d6afc08396"",""updated_at"":""2026-01-26T17:00:55.730782+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":59.64,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-01-31T11:04:08.266266+00:00"",""customer_price"":59.64,""exchange_rate_used"":null,""id"":""e564be1d-bca5-46e7-bd5f-eda5462b2029"",""payment_status"":""not_paid"",""reservation_id"":""4a763c59-7d45-444d-af3d-8049008fc405"",""updated_at"":""2026-01-31T11:04:08.266266+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":59.64,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-01-31T11:07:03.742232+00:00"",""customer_price"":59.64,""exchange_rate_used"":null,""id"":""095d28b0-4396-4302-a921-5fd65da57664"",""payment_status"":""not_paid"",""reservation_id"":""7c988e95-9e42-4646-8bb4-47e6f7ea2425"",""updated_at"":""2026-01-31T11:08:01.047209+00:00""},{""agency_notes"":null,""agency_price_currency"":""AUD"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":100,""company_amount_try"":null,""conversion_date"":""2026-01-30"",""created_at"":""2026-01-29T07:16:29.623078+00:00"",""customer_price"":100,""exchange_rate_used"":30.488,""id"":""4d865ddd-c46f-456a-a165-6f1d11424116"",""payment_status"":""not_paid"",""reservation_id"":""5462b165-e9e1-4347-8700-d24b221c7458"",""updated_at"":""2026-01-31T13:12:44.220955+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":2600,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-08T16:20:08.230764+00:00"",""customer_price"":2600,""exchange_rate_used"":null,""id"":""e6f85679-cb29-42eb-ba40-00a51dd39003"",""payment_status"":""not_paid"",""reservation_id"":""60117cfa-097a-498a-8b3c-85e4b9950354"",""updated_at"":""2026-02-08T16:20:55.983131+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":35,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-03T16:20:15.47075+00:00"",""customer_price"":35,""exchange_rate_used"":null,""id"":""8ecddfe7-7ed3-4130-97cd-f72918c9b348"",""payment_status"":""not_paid"",""reservation_id"":""5f1db070-cd98-49b7-88b9-d6d21a15a6cd"",""updated_at"":""2026-02-03T16:20:15.47075+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":35,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-03T16:22:21.704701+00:00"",""customer_price"":35,""exchange_rate_used"":null,""id"":""ee34ba41-1858-40eb-a45c-2f666570af25"",""payment_status"":""not_paid"",""reservation_id"":""6064c379-0977-41ba-9f46-7bff05f2a900"",""updated_at"":""2026-02-03T16:22:21.704701+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":1600,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-04T14:49:41.44294+00:00"",""customer_price"":1600,""exchange_rate_used"":null,""id"":""0469ced9-8edc-4cf7-ab05-220238b56acd"",""payment_status"":""not_paid"",""reservation_id"":""d0ad988c-fe1e-4e23-b3eb-86b14494ced5"",""updated_at"":""2026-02-04T14:49:41.44294+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":70,""company_amount_try"":null,""conversion_date"":""2026-01-30"",""created_at"":""2026-01-31T15:50:05.879843+00:00"",""customer_price"":70,""exchange_rate_used"":51.832,""id"":""095499cd-4504-4c87-b0db-02d351a2db64"",""payment_status"":""not_paid"",""reservation_id"":""8dcd4295-af57-471d-b8eb-68e2bdf3b30f"",""updated_at"":""2026-02-04T14:50:05.596547+00:00""},{""agency_notes"":""Quick Booking - Return Trip"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":70,""company_amount_try"":null,""conversion_date"":""2026-02-03"",""created_at"":""2026-01-31T15:50:06.009458+00:00"",""customer_price"":70,""exchange_rate_used"":51.325,""id"":""695d8ea1-88a5-4674-a0cb-f700bab2a769"",""payment_status"":""not_paid"",""reservation_id"":""9b8ca162-7a34-4e11-8443-8b42eda24788"",""updated_at"":""2026-02-04T14:50:47.486726+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":1,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-04T18:16:46.632174+00:00"",""customer_price"":1,""exchange_rate_used"":null,""id"":""237e1f46-b681-41f9-9bbf-ba2ec7205ddb"",""payment_status"":""not_paid"",""reservation_id"":""af61965c-25bf-49bd-993b-091a9e523506"",""updated_at"":""2026-02-04T18:16:46.632174+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":450,""company_amount_try"":null,""conversion_date"":""2026-02-11"",""created_at"":""2026-02-09T19:22:43.55189+00:00"",""customer_price"":450,""exchange_rate_used"":51.935,""id"":""e852f9ec-f174-4923-8938-df8f74a085f8"",""payment_status"":""not_paid"",""reservation_id"":""bcaf2715-2e8b-460d-92d5-de4a72c1d27b"",""updated_at"":""2026-02-12T07:24:54.57923+00:00""},`;

// Fix quotes and prepare JSON array
let cleanedData = rawDataChunk.trim();
if (cleanedData.endsWith(',')) {
    cleanedData = cleanedData.slice(0, -1);
}
// Wrap in array if not already
if (!cleanedData.startsWith('[')) {
    cleanedData = '[' + cleanedData + ']';
}

cleanedData = cleanedData.replace(/""/g, '"');
const payments = JSON.parse(cleanedData);

const sqlValues = payments.map(p => {
    const formatValue = (val) => val === null ? 'NULL' : (typeof val === 'string' ? `'${val}'` : val);
    
    return `(
    ${formatValue(p.id)}, 
    ${formatValue(p.reservation_id)}, 
    ${formatValue(p.agency_notes)}, 
    ${formatValue(p.agency_price_currency)}, 
    ${formatValue(p.agency_profit)}, 
    ${formatValue(p.agency_user_id)}, 
    ${formatValue(p.company_amount)}, 
    ${formatValue(p.company_amount_try)}, 
    ${formatValue(p.conversion_date)}, 
    ${formatValue(p.customer_price)}, 
    ${formatValue(p.exchange_rate_used)}, 
    ${formatValue(p.payment_status)}
    )`;
}).join(',\n');

const sql = `
-- Ekstra Payment Verileri (Part 2)
INSERT INTO public.reservation_payments (
    id, reservation_id, agency_notes, agency_price_currency, agency_profit, 
    agency_user_id, company_amount, company_amount_try, conversion_date, 
    customer_price, exchange_rate_used, payment_status
) VALUES
${sqlValues}
ON CONFLICT (id) DO UPDATE SET
  agency_notes = EXCLUDED.agency_notes,
  agency_price_currency = EXCLUDED.agency_price_currency,
  agency_profit = EXCLUDED.agency_profit,
  agency_user_id = EXCLUDED.agency_user_id,
  company_amount = EXCLUDED.company_amount,
  company_amount_try = EXCLUDED.company_amount_try,
  conversion_date = EXCLUDED.conversion_date,
  customer_price = EXCLUDED.customer_price,
  exchange_rate_used = EXCLUDED.exchange_rate_used,
  payment_status = EXCLUDED.payment_status,
  updated_at = now();
`;

fs.writeFileSync('insert_payments_batch_2.sql', sql);
console.log('insert_payments_batch_2.sql oluşturuldu.');
