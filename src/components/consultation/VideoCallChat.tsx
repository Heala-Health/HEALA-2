
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'patient' | 'physician';
  created_at: string;
}

interface VideoCallChatProps {
  sessionId: string;
  currentUserId: string;
  onClose: () => void;
}

export const VideoCallChat: React.FC<VideoCallChatProps> = ({
  sessionId,
  currentUserId,
  onClose
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages from consultation_messages table
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('📥 [VideoCallChat] Loading messages for session:', sessionId);
        
        const { data, error } = await supabase
          .from('consultation_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ [VideoCallChat] Error loading messages:', error);
          return;
        }
        
        console.log('✅ [VideoCallChat] Loaded messages:', data?.length || 0);
        
        // Map messages to ChatMessage format
        const chatMessages: ChatMessage[] = (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_type: msg.sender_type as 'patient' | 'physician',
          created_at: msg.created_at
        }));
        
        setMessages(chatMessages);
      } catch (error) {
        console.error('❌ [VideoCallChat] Error loading chat messages:', error);
      }
    };

    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  // Set up real-time message subscription
  useEffect(() => {
    if (!sessionId) return;

    console.log('📡 [VideoCallChat] Setting up real-time subscription for session:', sessionId);
    
    const channel = supabase
      .channel(`consultation_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📨 [VideoCallChat] New message received:', payload);
          const newMsg = payload.new;
          
          const chatMessage: ChatMessage = {
            id: newMsg.id,
            content: newMsg.content,
            sender_id: newMsg.sender_id,
            sender_type: newMsg.sender_type as 'patient' | 'physician',
            created_at: newMsg.created_at
          };
          
          setMessages(prev => [...prev, chatMessage]);
        }
      )
      .subscribe((status) => {
        console.log('📡 [VideoCallChat] Subscription status:', status);
      });

    return () => {
      console.log('🧹 [VideoCallChat] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading || !sessionId) return;

    setIsLoading(true);
    try {
      console.log('📤 [VideoCallChat] Sending message:', newMessage.substring(0, 50) + '...');
      
      const { error } = await supabase
        .from('consultation_messages')
        .insert({
          session_id: sessionId,
          content: newMessage.trim(),
          sender_id: currentUserId,
          sender_type: profile?.role === 'physician' ? 'physician' : 'patient'
        });

      if (error) {
        console.error('❌ [VideoCallChat] Error sending message:', error);
        throw error;
      }

      console.log('✅ [VideoCallChat] Message sent successfully');
      setNewMessage('');
    } catch (error) {
      console.error('❌ [VideoCallChat] Error sending message:', error);
      toast({
        title: "❌ Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Start a conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.sender_id === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
