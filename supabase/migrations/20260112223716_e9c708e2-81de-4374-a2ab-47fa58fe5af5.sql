-- Drop existing foreign key constraints and recreate with CASCADE DELETE

-- 1. agency_reservation_details
ALTER TABLE public.agency_reservation_details 
DROP CONSTRAINT IF EXISTS agency_reservation_details_reservation_id_fkey;

ALTER TABLE public.agency_reservation_details 
ADD CONSTRAINT agency_reservation_details_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 2. agency_transactions
ALTER TABLE public.agency_transactions 
DROP CONSTRAINT IF EXISTS agency_transactions_reservation_id_fkey;

ALTER TABLE public.agency_transactions 
ADD CONSTRAINT agency_transactions_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 3. driver_reviews
ALTER TABLE public.driver_reviews 
DROP CONSTRAINT IF EXISTS driver_reviews_reservation_id_fkey;

ALTER TABLE public.driver_reviews 
ADD CONSTRAINT driver_reviews_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 4. notifications
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_reservation_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 5. price_history
ALTER TABLE public.price_history 
DROP CONSTRAINT IF EXISTS price_history_reservation_id_fkey;

ALTER TABLE public.price_history 
ADD CONSTRAINT price_history_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 6. reservation_admin_notes
ALTER TABLE public.reservation_admin_notes 
DROP CONSTRAINT IF EXISTS reservation_admin_notes_reservation_id_fkey;

ALTER TABLE public.reservation_admin_notes 
ADD CONSTRAINT reservation_admin_notes_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 7. whatsapp_booking_confirmations
ALTER TABLE public.whatsapp_booking_confirmations 
DROP CONSTRAINT IF EXISTS whatsapp_booking_confirmations_reservation_id_fkey;

ALTER TABLE public.whatsapp_booking_confirmations 
ADD CONSTRAINT whatsapp_booking_confirmations_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 8. whatsapp_messages
ALTER TABLE public.whatsapp_messages 
DROP CONSTRAINT IF EXISTS whatsapp_messages_reservation_id_fkey;

ALTER TABLE public.whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 9. reservations self-reference (original_reservation_id for return trips)
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_original_reservation_id_fkey;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_original_reservation_id_fkey 
FOREIGN KEY (original_reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL;