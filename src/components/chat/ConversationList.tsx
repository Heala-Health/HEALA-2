
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string;
  title: string;
  status: string;
  created_at: string;
  patient_name: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-600">No active conversations</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="font-medium text-sm">{conversation.patient_name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </div>
                <Badge variant="outline" className="text-xs mt-1">
                  {conversation.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
