-- Create consultation_messages table
CREATE TABLE public.consultation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.consultation_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'physician')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Participants can view session messages" 
ON public.consultation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.consultation_sessions s
    WHERE s.id = consultation_messages.session_id 
    AND (auth.uid() = s.patient_id OR auth.uid() = s.physician_id)
  )
);

CREATE POLICY "Participants can send messages" 
ON public.consultation_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.consultation_sessions s
    WHERE s.id = consultation_messages.session_id 
    AND (auth.uid() = s.patient_id OR auth.uid() = s.physician_id)
  )
  AND sender_id = auth.uid()
);

-- Create trigger for updated_at
CREATE TRIGGER update_consultation_messages_updated_at
  BEFORE UPDATE ON public.consultation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_consultation_messages_session_id ON public.consultation_messages(session_id);
CREATE INDEX idx_consultation_messages_created_at ON public.consultation_messages(created_at);