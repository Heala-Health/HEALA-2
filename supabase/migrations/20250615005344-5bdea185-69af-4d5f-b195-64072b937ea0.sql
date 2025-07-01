
-- Create consultation_messages table for video call chat
CREATE TABLE public.consultation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.consultation_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'physician')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consultation messages
CREATE POLICY "Users can view messages from their sessions" ON public.consultation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions cs 
      WHERE cs.id = session_id 
      AND (cs.patient_id = auth.uid() OR cs.physician_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their sessions" ON public.consultation_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.consultation_sessions cs 
      WHERE cs.id = session_id 
      AND (cs.patient_id = auth.uid() OR cs.physician_id = auth.uid())
    )
  );

-- Enable real-time subscriptions for the table
ALTER TABLE public.consultation_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;

-- Create index for better performance
CREATE INDEX idx_consultation_messages_session_id ON public.consultation_messages(session_id);
CREATE INDEX idx_consultation_messages_created_at ON public.consultation_messages(created_at);
