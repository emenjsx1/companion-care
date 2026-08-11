-- Create table to store incoming WhatsApp messages
CREATE TABLE public.whatsapp_received_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_phone TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  instance_name TEXT NOT NULL DEFAULT 'rodauto',
  remote_jid TEXT,
  message_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_received_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view received messages" 
ON public.whatsapp_received_messages 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update received messages" 
ON public.whatsapp_received_messages 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete received messages" 
ON public.whatsapp_received_messages 
FOR DELETE 
USING (is_admin());

-- Allow insert from edge function (no auth required for webhook)
CREATE POLICY "Allow webhook inserts" 
ON public.whatsapp_received_messages 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_received_created_at ON public.whatsapp_received_messages(created_at DESC);
CREATE INDEX idx_whatsapp_received_is_read ON public.whatsapp_received_messages(is_read);