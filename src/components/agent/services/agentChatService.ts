
import { supabase } from '@/integrations/supabase/client';

export interface AgentConversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface AgentMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  sender_id: string;
}

export const fetchAgentConversations = async (): Promise<AgentConversation[]> => {
  const { data: conversationData, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'agent_support')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Fetch patient details for each conversation
  const conversationsWithPatients = await Promise.all(
    (conversationData || []).map(async (conversation) => {
      let patient = null;
      if (conversation.patient_id) {
        const { data: patientData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', conversation.patient_id)
          .single();
        patient = patientData;
      }

      return {
        ...conversation,
        patient
      };
    })
  );

  return conversationsWithPatients;
};

export const fetchConversationMessages = async (conversationId: string): Promise<AgentMessage[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const sendAgentMessage = async (
  conversationId: string,
  content: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_type: 'agent',
      sender_id: userId
    });

  if (error) throw error;
};

export const subscribeToAgentMessages = (
  conversationId: string,
  onNewMessage: (message: AgentMessage) => void
) => {
  const channel = supabase
    .channel(`agent-messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onNewMessage(payload.new as AgentMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
