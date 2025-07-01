
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  sender_id: string;
}

export const useAgentChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'agent_support')
        .order('created_at', { ascending: false });

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

      setConversations(conversationsWithPatients);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          content: content,
          sender_type: 'agent',
          sender_id: user.id
        });

      if (error) throw error;

      fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    sendMessage
  };
};
