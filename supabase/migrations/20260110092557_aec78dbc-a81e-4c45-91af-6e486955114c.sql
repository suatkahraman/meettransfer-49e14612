-- Add reminder_sent_at column to track when reminders were sent
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of reservations needing reminders
CREATE INDEX IF NOT EXISTS idx_reservations_reminder_pending 
ON public.reservations (pickup_date, status) 
WHERE reminder_sent_at IS NULL;