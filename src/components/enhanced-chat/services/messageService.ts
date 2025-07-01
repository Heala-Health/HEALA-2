
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  return (data || []).map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    sender_type: msg.sender_type,
    sender_id: msg.sender_id,
    is_read: false,
    read_at: undefined,
    message_attachments: msg.metadata,
    created_at: msg.created_at
  }));
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  userId?: string,
  senderType?: 'patient' | 'physician' | 'agent'
): Promise<void> => {
  // Determine sender type based on user role if not provided
  let finalSenderType = senderType;
  
  if (!finalSenderType && userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (profile) {
      finalSenderType = profile.role === 'agent' ? 'agent' : 
                      profile.role === 'physician' ? 'physician' : 'patient';
    }
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_id: userId,
      sender_type: finalSenderType || 'patient'
    });

  if (error) throw error;
};
