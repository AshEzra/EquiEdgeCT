-- Create invitations table for managing access
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'expert')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create conversations table (links users to experts, optionally through bookings)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'locked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expert_id, booking_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Anyone can view their own invitation" 
ON public.invitations 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage invitations" 
ON public.invitations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.email IN ('demo@equiedge.co', 'admin@equiedge.co')
));

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = conversations.user_id 
  AND profiles.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = conversations.expert_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = conversations.user_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Participants can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = conversations.user_id 
  AND profiles.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = conversations.expert_id 
  AND profiles.user_id = auth.uid()
));

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  JOIN public.profiles ON (
    profiles.id = conversations.user_id OR 
    profiles.id = conversations.expert_id
  )
  WHERE conversations.id = messages.conversation_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations 
  JOIN public.profiles ON (
    profiles.id = conversations.user_id OR 
    profiles.id = conversations.expert_id
  )
  WHERE conversations.id = messages.conversation_id 
  AND profiles.user_id = auth.uid()
  AND profiles.id = messages.sender_id
));

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = messages.sender_id 
  AND profiles.user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default invitations for existing whitelist emails
INSERT INTO public.invitations (email, role, status) VALUES
  ('demo@equiedge.co', 'user', 'accepted'),
  ('expert@equiedge.co', 'expert', 'accepted'), 
  ('rider@equiedge.co', 'user', 'accepted'),
  ('coach@equiedge.co', 'expert', 'accepted');

-- Create function to lock conversations when bookings expire
CREATE OR REPLACE FUNCTION public.check_conversation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking status changes to completed/cancelled, lock conversation
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
    UPDATE public.conversations 
    SET status = 'locked', updated_at = now()
    WHERE booking_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically lock conversations when bookings end
CREATE TRIGGER lock_conversation_on_booking_end
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_conversation_status();