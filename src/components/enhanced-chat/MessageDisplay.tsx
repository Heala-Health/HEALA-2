
import React from 'react';
import { Message } from './types';

interface MessageDisplayProps {
  messages: Message[];
  currentUserId?: string;
  typingUsers: any[];
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  currentUserId,
  typingUsers
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[75%] p-3 rounded-lg break-words ${
              message.sender_id === currentUserId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs opacity-70">
                {formatTime(message.created_at)}
              </span>
              {message.sender_id === currentUserId && (
                <span className="text-xs opacity-70">
                  {message.is_read ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[75%]">
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
    </div>
  );
};
