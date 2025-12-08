-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add 'assigned' status to the allowed values if not already present
-- (The constraint already includes 'assigned' from previous migration)