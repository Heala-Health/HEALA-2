
import React from 'react';
import { User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician';
  sender_id: string;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Start a conversation</p>
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
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === currentUserId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
