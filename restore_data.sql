-- Table: agency_payments
INSERT INTO public.agency_payments (
  agency_id, amount, created_at, created_by, currency, id, notes, payment_date
) VALUES
  ('a87cdea4-27fe-4332-bbaf-00b9001ed469', 5800, '2026-01-04T13:25:41.998703+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'TRY', '6a28e2b1-df5d-476b-861b-2e02bac0cb54', NULL, '2025-12-30'),
  ('4884f17e-d5ad-446c-8feb-cea3894d0fe4', 110, '2026-01-07T08:10:54.036411+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'EUR', '4ba6991b-72c9-43f3-9bd4-ab7dcdc44c19', NULL, '2026-01-07'),
  ('ddc3103b-1003-4d68-a393-b02a798ee3ce', 8950, '2026-01-09T15:56:40.86381+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'TRY', '8198fa4c-28e3-4476-914e-210413a44d03', NULL, '2025-12-31'),
  ('a87cdea4-27fe-4332-bbaf-00b9001ed469', 15200, '2026-01-09T18:44:23.904815+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'TRY', '345fa128-37dc-41aa-9ce9-069c94a28b64', NULL, '2026-01-09'),
  ('1db06d07-458e-4584-af30-4a63523bb517', 431.47, '2026-01-10T00:59:14.737845+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'EUR', '31a753f9-dd91-42d1-954f-befb7d6b4b04', NULL, '2026-01-10'),
  ('1db06d07-458e-4584-af30-4a63523bb517', 165, '2026-01-10T00:59:39.438542+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'AED', '136dde84-452f-46f5-98f0-7028955feb3e', NULL, '2026-01-10'),
  ('ddc3103b-1003-4d68-a393-b02a798ee3ce', 252.89, '2026-02-08T00:37:21.66309+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'USD', 'de41b0a7-4662-43fc-8d07-343fdf14202b', NULL, '2026-02-08'),
  ('a87cdea4-27fe-4332-bbaf-00b9001ed469', 31450, '2026-02-08T00:37:59.345727+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'TRY', 'e223ab3f-e703-4fc5-879e-b7cf2410bba7', NULL, '2026-02-08')
ON CONFLICT (id) DO UPDATE SET
  agency_id = EXCLUDED.agency_id, amount = EXCLUDED.amount, created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, currency = EXCLUDED.currency, notes = EXCLUDED.notes, payment_date = EXCLUDED.payment_date;

-- Table: driver_payments
INSERT INTO public.driver_payments (
  amount, created_at, created_by, driver_id, id, notes, payment_date, payment_type
) VALUES
  (3000, '2025-12-28T12:14:35.137068+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'f18b35b5-29f8-4fc0-9961-4ac2487b5267', '5717f4f7-d917-4b13-bb3c-7c53fc7f8964', NULL, '2025-12-28', 'from_driver'),
  (850, '2025-12-28T12:14:42.867205+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '5d1dfc09-35a9-4e8d-beba-c06df30506c7', '7b699f1b-c83c-4a2c-bf95-a9d1d22269d1', NULL, '2025-12-28', 'to_driver'),
  (3000, '2025-12-28T12:14:48.918355+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '598b2b99-0661-4dbe-a52e-0d9ab9fb203f', NULL, '2025-12-28', 'to_driver'),
  (5000, '2025-12-30T10:19:29.273201+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '149723bd-4d1a-4acb-b306-a762fb3fa32b', NULL, '2025-12-30', 'to_driver'),
  (10000, '2026-01-02T11:41:28.182414+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '5fb5b8a4-f630-41e2-b167-65e33fe883b4', NULL, '2026-01-02', 'to_driver'),
  (235, '2026-01-02T12:38:50.381475+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', 'fdb6de5b-adcf-444b-970d-40beafb15dd6', NULL, '2026-01-02', 'to_driver'),
  (1250, '2026-01-12T22:39:53.588612+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '5d1dfc09-35a9-4e8d-beba-c06df30506c7', '93b576f0-c660-489a-bf00-df6026c939ea', NULL, '2026-01-12', 'to_driver'),
  (5000, '2026-01-19T10:34:54.979665+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '3ee0edfc-6c16-42f3-b8b1-b8bd5fd43fff', NULL, '2026-01-19', 'to_driver'),
  (5000, '2026-01-23T09:53:32.643622+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', 'dc413449-eba3-4594-8d63-a1d61ec984d6', NULL, '2026-01-23', 'to_driver'),
  (5000, '2026-01-28T16:27:20.392727+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '33d1a2ed-d217-4dfe-ae8b-40bfd43a5307', NULL, '2026-01-28', 'to_driver'),
  (7000, '2026-02-02T10:50:56.397012+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', '449f3b57-9659-42a9-8524-3901a9cb5793', NULL, '2026-02-02', 'to_driver'),
  (5000, '2026-02-15T10:03:14.420859+00:00', '9f380270-56d1-40e3-abe8-41ea6d3afe5f', '3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', 'd0e06a20-ccc4-43f9-886c-7b04bd3e5c52', NULL, '2026-02-15', 'to_driver')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount, created_at = EXCLUDED.created_at, created_by = EXCLUDED.created_by, driver_id = EXCLUDED.driver_id, notes = EXCLUDED.notes, payment_date = EXCLUDED.payment_date, payment_type = EXCLUDED.payment_type;

-- Table: otp_settings
INSERT INTO public.otp_settings (
  created_at, description, id, setting_key, setting_value, updated_at
) VALUES
  ('2026-01-10T21:51:09.273997+00:00', 'Number of digits in OTP code (4, 6, or 8)', '5f0981cf-dec0-4f2f-856b-5e844fd40253', 'otp_length', '6', '2026-01-10T21:51:09.273997+00:00'),
  ('2026-01-10T21:51:09.273997+00:00', 'Maximum verification attempts before lockout', 'a99e4cfa-7b03-4724-975c-98ce1c54f8e2', 'max_verify_attempts', '5', '2026-01-10T21:51:09.273997+00:00'),
  ('2026-01-10T21:51:09.273997+00:00', 'Seconds to wait before allowing OTP resend', '12c1b653-63c0-4728-89fd-134c73163da0', 'resend_cooldown_seconds', '60', '2026-01-10T21:51:09.273997+00:00'),
  ('2026-01-10T21:51:09.273997+00:00', 'Number of failed logins to trigger 2FA', 'ba08279e-eecd-467f-a821-a4c2cda5b346', 'failed_login_threshold', '2', '2026-01-10T21:51:09.273997+00:00'),
  ('2026-01-12T23:42:00.842103+00:00', 'Number of days a device remains trusted before requiring 2FA again', '57634dfb-1f8e-4bf2-8c49-0c2fa527b99e', 'trusted_device_days', '30', '2026-01-12T23:42:00.842103+00:00'),
  ('2026-01-10T21:51:09.273997+00:00', 'OTP expiration time in minutes', '12afc828-ef46-455b-8fdd-22e4b9d14191', 'otp_expiry_minutes', '10', '2026-01-24T14:47:49.60699+00:00')
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at, description = EXCLUDED.description, setting_key = EXCLUDED.setting_key, setting_value = EXCLUDED.setting_value, updated_at = EXCLUDED.updated_at;

-- Table: price_thresholds
INSERT INTO public.price_thresholds (
  created_at, id, min_price_eur, updated_at, vehicle_type
) VALUES
  ('2026-01-11T14:34:06.186628+00:00', '96cf13e5-80ba-4277-85d3-d7cbde06600a', 50, '2026-01-11T14:34:06.186628+00:00', 'mercedes-vito'),
  ('2026-01-11T14:34:06.186628+00:00', 'fb5ce10a-c946-4849-881f-c36ab896ca55', 60, '2026-01-11T14:34:06.186628+00:00', 'vip-mercedes'),
  ('2026-01-11T14:34:06.186628+00:00', '3f280af0-8c50-44d5-b057-3306af268ab5', 70, '2026-01-11T14:34:06.186628+00:00', 'maybach-minibus'),
  ('2026-01-11T14:34:06.186628+00:00', '64ff2927-4f52-4dbb-8b99-1b1617b06313', 100, '2026-01-11T14:34:06.186628+00:00', 'minibus'),
  ('2026-01-17T10:36:13.139523+00:00', 'a324fda7-b4a4-4910-875c-bcaf0027be94', 100, '2026-01-17T10:36:13.139523+00:00', 'dubai-v-class'),
  ('2026-01-14T23:24:54.625818+00:00', '8585708a-f554-4ccb-8197-008ed620c85d', 36, '2026-02-04T22:43:20.103472+00:00', 'sedan')
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at, min_price_eur = EXCLUDED.min_price_eur, updated_at = EXCLUDED.updated_at, vehicle_type = EXCLUDED.vehicle_type;

