-- Remove the overly permissive policy that allows unrestricted access
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.push_subscriptions;