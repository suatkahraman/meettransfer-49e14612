-- Create WhatsApp conversations table to track customer conversations
CREATE TABLE public.whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone text NOT NULL UNIQUE,
    customer_name text,
    customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    unread_count integer DEFAULT 0,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create WhatsApp messages table to store all messages
CREATE TABLE public.whatsapp_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_type text DEFAULT 'text',
    content text NOT NULL,
    twilio_sid text,
    sent_by_user_id uuid,
    reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}',
    status text DEFAULT 'sent',
    created_at timestamp with time zone DEFAULT now()
);

-- Create customer magic links table
CREATE TABLE public.customer_magic_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone text NOT NULL,
    token text NOT NULL UNIQUE,
    customer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Create booking confirmations table for price confirmations
CREATE TABLE public.whatsapp_booking_confirmations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
    price numeric NOT NULL,
    currency text DEFAULT 'EUR',
    confirmation_token text NOT NULL UNIQUE,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
    confirmed_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Add is_return_transfer and discount fields to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS is_return_transfer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS original_reservation_id uuid REFERENCES public.reservations(id),
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_booking_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_conversations
CREATE POLICY "Admins can manage whatsapp conversations"
ON public.whatsapp_conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view own conversation"
ON public.whatsapp_conversations
FOR SELECT
USING (customer_user_id = auth.uid());

-- RLS Policies for whatsapp_messages
CREATE POLICY "Admins can manage whatsapp messages"
ON public.whatsapp_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view own messages"
ON public.whatsapp_messages
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_messages.conversation_id
    AND c.customer_user_id = auth.uid()
));

-- RLS Policies for customer_magic_links
CREATE POLICY "Admins can manage magic links"
ON public.customer_magic_links
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for whatsapp_booking_confirmations
CREATE POLICY "Admins can manage booking confirmations"
ON public.whatsapp_booking_confirmations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view own booking confirmations"
ON public.whatsapp_booking_confirmations
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_booking_confirmations.conversation_id
    AND c.customer_user_id = auth.uid()
));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(customer_phone);
CREATE INDEX idx_whatsapp_conversations_last_message ON public.whatsapp_conversations(last_message_at DESC);
CREATE INDEX idx_magic_links_token ON public.customer_magic_links(token);
CREATE INDEX idx_booking_confirmations_token ON public.whatsapp_booking_confirmations(confirmation_token);