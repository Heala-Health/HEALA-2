
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Message, TypingIndicator } from '../types';
import { fetchMessages, sendMessage as sendMessageService } from '../services/messageService';
import { subscribeToMessages } from '../services/realtimeService';
import { useTypingIndicator } from '../services/typingService';

export const useEnhancedChat = (conversationId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  
  const { handleTyping, cleanup } = useTypingIndicator();

  useEffect(() => {
    if (conversationId && user) {
      loadMessages();
      const unsubscribe = setupRealtimeSubscription();
      
      return () => {
        unsubscribe();
        cleanup();
      };
    }
  }, [conversationId, user]);

  const loadMessages = async () => {
    try {
      const fetchedMessages = await fetchMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const handleMessageInsert = (message: Message) => {
      setMessages(current => [...current, message]);
    };

    const handleMessageUpdate = (message: Message) => {
      setMessages(current => 
        current.map(msg => 
          msg.id === message.id ? message : msg
        )
      );
    };

    return subscribeToMessages(
      conversationId,
      handleMessageInsert,
      handleMessageUpdate
    );
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await sendMessageService(conversationId, content, user?.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    typingUsers,
    handleTyping,
    sendMessage
  };
};
