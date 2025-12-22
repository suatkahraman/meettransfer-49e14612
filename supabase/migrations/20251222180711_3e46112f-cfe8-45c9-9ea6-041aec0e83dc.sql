-- Add policy to block unauthenticated access to push_subscriptions table
-- This ensures only authenticated users can access push subscription data

CREATE POLICY "Require authentication for push_subscriptions access"
ON public.push_subscriptions
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);