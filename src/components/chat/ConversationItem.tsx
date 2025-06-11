
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { Conversation } from './types';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  onClick 
}) => {
  return (
    <div
      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {conversation.type === 'ai_diagnosis' ? (
            <Bot className="w-4 h-4 text-blue-500" />
          ) : (
            <User className="w-4 h-4 text-green-500" />
          )}
          <span className="font-medium text-sm">
            {conversation.title || 'Untitled Conversation'}
          </span>
        </div>
        <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
          {conversation.status}
        </Badge>
      </div>
      {conversation.physician && (
        <p className="text-xs text-gray-600">
          Dr. {conversation.physician.first_name} {conversation.physician.last_name} - {conversation.physician.specialization}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        {new Date(conversation.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};
