import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Paperclip, Mic, Camera, MoreVertical, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database, Json } from '@/integrations/supabase/types'; // Import Database and Json types

type MessageRow = Database['public']['Tables']['messages']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ConversationRow = Database['public']['Tables']['conversations']['Row'];

interface Message extends MessageRow {
  is_read?: boolean; // Client-side property, not from DB
  read_at?: string; // Client-side property, not from DB
  message_attachments?: Json | null; // Maps to metadata from DB
}

interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
}

interface ParticipantProfile {
  first_name: string;
  last_name: string;
  role: ProfileRow['role'];
  specialization?: string | null;
  phone?: string | null;
}

interface EnhancedChatProps {
  conversationId: string;
  onBack: () => void;
}

export const EnhancedPatientPhysicianChat: React.FC<EnhancedChatProps> = ({
  conversationId,
  onBack
}) => {
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [participantProfile, setParticipantProfile] = useState<ParticipantProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (conversationId && user) {
      fetchConversationAndParticipant();
      fetchMessages();
      subscribeToMessages();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationAndParticipant = async () => {
    if (!user) return;

    try {
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('patient_id, physician_id, type') // Removed agent_id
        .eq('id', conversationId)
        .single();

      if (conversationError) throw conversationError;

      let otherParticipantId: string | null = null;

      if (conversation.patient_id === user.id) {
        otherParticipantId = conversation.physician_id; // This could be a physician or an agent
      } else if (conversation.physician_id === user.id) {
        otherParticipantId = conversation.patient_id;
      }

      if (otherParticipantId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, role, specialization, phone')
          .eq('id', otherParticipantId)
          .single();

        if (profileError) throw profileError;

        setParticipantProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching conversation or participant:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const transformedMessages: Message[] = (data || []).map((msg: MessageRow) => ({
        ...msg,
        is_read: false, // Assuming client-side tracking or default
        read_at: undefined, // Assuming client-side tracking or default
        message_attachments: msg.metadata // Map metadata to message_attachments
      }));
      
      setMessages(transformedMessages);
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

  const subscribeToMessages = () => {
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
          const newMsg = payload.new as MessageRow;
          const transformedMessage: Message = {
            ...newMsg,
            is_read: false,
            read_at: undefined,
            message_attachments: newMsg.metadata
          };
          setMessages(current => [...current, transformedMessage]);
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
          const updatedMsg = payload.new as MessageRow;
          const transformedMessage: Message = {
            ...updatedMsg,
            is_read: false,
            read_at: undefined,
            message_attachments: updatedMsg.metadata
          };
          setMessages(current => 
            current.map(msg => 
              msg.id === transformedMessage.id ? transformedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTyping = async () => {
    // Simple typing indicator without database interaction for now
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing after 3 seconds
    }, 3000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: newMessage,
          sender_id: user?.id,
          sender_type: currentUserProfile?.role || 'patient'
        });

      if (error) throw error;

      setNewMessage('');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading chat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">
                {participantProfile ? 
                  `${participantProfile.role === 'physician' ? 'Dr. ' : ''}${participantProfile.first_name} ${participantProfile.last_name}` 
                  : 'Loading...'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {participantProfile?.role === 'physician' && participantProfile.specialization}
                {participantProfile?.role === 'agent' && participantProfile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {participantProfile.phone}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {formatTime(message.created_at)}
                  </span>
                  {message.sender_id === user?.id && (
                    <span className="text-xs opacity-70">
                      {/* Removed is_read check as it's not in DB */}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm">Typing</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Camera className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              className="flex-1"
              disabled={sending}
            />
            <Button variant="ghost" size="sm">
              <Mic className="w-4 h-4" />
            </Button>
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
