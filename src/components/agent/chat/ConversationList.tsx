
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Users } from 'lucide-react';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onConversationSelect: (id: string) => void;
  loading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Patient Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-4">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No conversations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="font-medium">
                  {conversation.patient ? 
                    `${conversation.patient.first_name} ${conversation.patient.last_name}` : 
                    'Unknown Patient'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {conversation.title || 'Support Conversation'}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {conversation.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
