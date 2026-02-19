const fs = require('fs');

// Raw data from user (copy-pasted)
const rawDataChunk = `{""agency_notes"":null,""agency_price_currency"":""USD"",""agency_profit"":66.64,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":""2026-02-11"",""created_at"":""2026-02-08T07:10:01.135685+00:00"",""customer_price"":66.64,""exchange_rate_used"":43.643,""id"":""831eb12a-42c8-4f16-bc84-fed088e4c4a6"",""payment_status"":""not_paid"",""reservation_id"":""a7dfd7d4-1878-456b-9bf1-8990df9ce2f5"",""updated_at"":""2026-02-12T07:24:55.329295+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":45,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-13T16:04:04.07081+00:00"",""customer_price"":45,""exchange_rate_used"":null,""id"":""7867d337-37ab-4898-b75d-e3aa98937ba9"",""payment_status"":""not_paid"",""reservation_id"":""b66eebb7-f054-45fb-b932-d66195271d0a"",""updated_at"":""2026-02-13T16:04:04.07081+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":2200,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-13T13:51:55.211512+00:00"",""customer_price"":2200,""exchange_rate_used"":null,""id"":""39d274aa-d181-4c67-8f61-dbd00e153f8b"",""payment_status"":""not_paid"",""reservation_id"":""085231aa-c4b7-435d-ba10-6a8cbac81eac"",""updated_at"":""2026-02-13T16:43:57.392268+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":1050,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-10T07:59:09.507769+00:00"",""customer_price"":1050,""exchange_rate_used"":null,""id"":""eed08dc2-e244-4489-83b3-e0526df29748"",""payment_status"":""not_paid"",""reservation_id"":""78ba364e-127d-4faf-9ce1-9df79d2d5955"",""updated_at"":""2026-02-13T16:44:58.103854+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":2200,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-13T16:48:44.500371+00:00"",""customer_price"":2200,""exchange_rate_used"":null,""id"":""1879d704-66d2-4c1c-948f-c43f46f13f97"",""payment_status"":""not_paid"",""reservation_id"":""d967ebc6-e027-4a77-b083-fb864bb43dcf"",""updated_at"":""2026-02-13T16:48:44.500371+00:00""},{""agency_notes"":null,""agency_price_currency"":""TRY"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":2200,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-13T16:51:33.753384+00:00"",""customer_price"":2200,""exchange_rate_used"":null,""id"":""24576bff-b09a-44f1-bd63-5eabc03b8018"",""payment_status"":""not_paid"",""reservation_id"":""d72b1462-f791-4431-9c57-a8d5866820bf"",""updated_at"":""2026-02-13T16:51:33.753384+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":42,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-15T12:43:58.063262+00:00"",""customer_price"":42,""exchange_rate_used"":null,""id"":""a0ff39cf-58e0-4183-9fb4-0937c2ae39a1"",""payment_status"":""not_paid"",""reservation_id"":""5a1828d9-8570-4a50-8195-4900b1a4db60"",""updated_at"":""2026-02-15T12:43:58.063262+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":37,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-15T12:45:19.812907+00:00"",""customer_price"":37,""exchange_rate_used"":null,""id"":""6ad09340-9914-41e5-af5c-ca6659575516"",""payment_status"":""not_paid"",""reservation_id"":""c2a54ad5-d541-46dc-bca6-711adee06259"",""updated_at"":""2026-02-15T12:45:19.812907+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":45,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-15T18:31:36.675641+00:00"",""customer_price"":45,""exchange_rate_used"":null,""id"":""05d72ee2-c900-4f11-ad29-b8c407f63846"",""payment_status"":""not_paid"",""reservation_id"":""38d33240-7b5e-4216-ae4f-42c42019a79c"",""updated_at"":""2026-02-15T18:31:36.675641+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":50,""company_amount_try"":null,""conversion_date"":""2026-02-13"",""created_at"":""2026-02-14T16:23:49.413439+00:00"",""customer_price"":50,""exchange_rate_used"":51.884,""id"":""22350734-49d5-4153-a987-3726a8afdf00"",""payment_status"":""not_paid"",""reservation_id"":""1e5f2ff4-1543-451e-b586-893a44ddd13a"",""updated_at"":""2026-02-15T19:25:14.936495+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":41,""company_amount_try"":null,""conversion_date"":""2026-02-13"",""created_at"":""2026-02-11T16:28:03.723537+00:00"",""customer_price"":41,""exchange_rate_used"":51.884,""id"":""671b96f9-3228-490c-bd1f-538866d0a44a"",""payment_status"":""not_paid"",""reservation_id"":""8d9f0a45-52fd-4152-a35e-f0f637a76efe"",""updated_at"":""2026-02-15T19:25:15.282687+00:00""},{""agency_notes"":null,""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":31,""company_amount_try"":null,""conversion_date"":""2026-02-13"",""created_at"":""2026-02-11T16:37:31.676492+00:00"",""customer_price"":31,""exchange_rate_used"":51.884,""id"":""d0c50461-be12-4f7e-8b71-d7f7728a9b3f"",""payment_status"":""not_paid"",""reservation_id"":""cfb70132-f46d-498b-b965-4bf5840078e4"",""updated_at"":""2026-02-15T19:25:15.783305+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":92,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-15T20:10:58.37867+00:00"",""customer_price"":92,""exchange_rate_used"":null,""id"":""cf56f69c-9a0c-4295-bf05-5d0aa806d489"",""payment_status"":""not_paid"",""reservation_id"":""cd002c0a-da0d-45ea-adc2-75395cbcc08e"",""updated_at"":""2026-02-15T20:10:58.37867+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":92,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-15T20:10:58.704435+00:00"",""customer_price"":92,""exchange_rate_used"":null,""id"":""6a5c08ca-fb4a-48c4-9e68-f12ac775baae"",""payment_status"":""not_paid"",""reservation_id"":""40fc3249-9fcf-4709-8344-00edb6382317"",""updated_at"":""2026-02-15T20:10:58.704435+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":50,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-14T09:18:32.344392+00:00"",""customer_price"":50,""exchange_rate_used"":null,""id"":""ed895286-afac-4f02-bb38-19bd84c512fc"",""payment_status"":""not_paid"",""reservation_id"":""238c7359-cdac-44f0-be41-765b6291e91e"",""updated_at"":""2026-02-15T20:18:42.032695+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:12.519934+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""6d0c50a3-e79c-4f3a-b408-5bd936395075"",""payment_status"":""not_paid"",""reservation_id"":""513c68f8-bae7-4ecb-b627-f8c3b758e0e3"",""updated_at"":""2026-02-16T04:10:12.519934+00:00""},{""agency_notes"":""Quick Booking - Return Trip"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:13.24593+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""a7cd1671-809b-4dee-8d6b-72fb0d7afc06"",""payment_status"":""not_paid"",""reservation_id"":""a72bed92-717e-4f20-b372-8445e4ef4521"",""updated_at"":""2026-02-16T04:10:13.24593+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:15.711183+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""6c4a8037-e579-4c3d-a117-2807ca2caef8"",""payment_status"":""not_paid"",""reservation_id"":""be0d9268-e001-4686-b7be-19ba3335b50c"",""updated_at"":""2026-02-16T04:10:15.711183+00:00""},{""agency_notes"":""Quick Booking - Return Trip"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:16.365918+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""24a0ac08-33aa-447c-84af-02878668c8c9"",""payment_status"":""not_paid"",""reservation_id"":""f26223b1-4a2a-4c97-afc4-a35622e177dd"",""updated_at"":""2026-02-16T04:10:16.365918+00:00""},{""agency_notes"":""Quick Booking - Direct Customer"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:16.924371+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""68a6534f-9d6a-4f7e-ac82-cea71b623425"",""payment_status"":""not_paid"",""reservation_id"":""5f837b41-2d32-49d3-9a18-d92b0fa57ed4"",""updated_at"":""2026-02-16T04:10:16.924371+00:00""},{""agency_notes"":""Quick Booking - Return Trip"",""agency_price_currency"":""EUR"",""agency_profit"":0,""agency_user_id"":null,""company_amount"":0,""company_amount_try"":null,""conversion_date"":null,""created_at"":""2026-02-16T04:10:17.571515+00:00"",""customer_price"":0,""exchange_rate_used"":null,""id"":""145dbfdd-b459-41b8-9fee-b19fafab539c"",""payment_status"":""not_paid"",""reservation_id"":""76185184-6856-4050-8d25-8139416583a8"",""updated_at"":""2026-02-16T04:10:17.571515+00:00""}]`;

// Fix quotes and prepare JSON array
let cleanedData = rawDataChunk.trim();
// Remove any trailing commas if present (simple check)
if (cleanedData.endsWith(',')) {
    cleanedData = cleanedData.slice(0, -1);
}

// Wrap in array if not already
if (!cleanedData.startsWith('[')) {
    cleanedData = '[' + cleanedData + ']';
}

// Replace double double-quotes with single double-quotes
cleanedData = cleanedData.replace(/""/g, '"');

let payments;
try {
    payments = JSON.parse(cleanedData);
} catch (e) {
    console.error("JSON Parse Error:", e.message);
    // Attempt to salvage if it's a nested array issue `[[...]]`
    if (cleanedData.startsWith('[[') && cleanedData.endsWith(']]')) {
        try {
            payments = JSON.parse(cleanedData)[0];
        } catch (e2) {
             process.exit(1);
        }
    } else {
        process.exit(1);
    }
}

// Ensure it is a flat array
if (Array.isArray(payments) && Array.isArray(payments[0])) {
    payments = payments.flat();
}


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
-- Ekstra Payment Verileri (Part 3)
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

fs.writeFileSync('insert_payments_batch_3.sql', sql);
console.log('insert_payments_batch_3.sql oluşturuldu.');
