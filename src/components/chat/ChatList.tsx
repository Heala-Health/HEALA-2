
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bot, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationItem } from './ConversationItem';
import { Conversation } from './types';

interface ChatListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onStartAIAssessment?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectConversation, onStartAIAssessment }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedConversations: Conversation[] = data?.map(conv => ({
        id: conv.id,
        type: conv.type as 'ai_diagnosis' | 'physician_consultation',
        title: conv.title,
        status: conv.status || 'active',
        created_at: conv.created_at,
        physician: conv.physician_id ? {
          first_name: 'Dr.',
          last_name: 'Physician',
          specialization: 'General'
        } : undefined
      })) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {onStartAIAssessment && (
          <Button 
            onClick={onStartAIAssessment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Bot className="w-4 h-4 mr-2" />
            Start AI Health Assessment
          </Button>
        )}
        
        {loading ? (
          <div className="text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500">
            No conversations yet. Start by booking an appointment with a physician.
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
