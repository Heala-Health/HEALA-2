
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';

export const subscribeToMessages = (
  conversationId: string,
  onMessageInsert: (message: Message) => void,
  onMessageUpdate: (message: Message) => void
) => {
  const transformMessage = (msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    sender_type: msg.sender_type,
    sender_id: msg.sender_id,
    is_read: false,
    read_at: undefined,
    message_attachments: msg.metadata,
    created_at: msg.created_at
  });

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const transformedMessage = transformMessage(payload.new as any);
        onMessageInsert(transformedMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const transformedMessage = transformMessage(payload.new as any);
        onMessageUpdate(transformedMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
