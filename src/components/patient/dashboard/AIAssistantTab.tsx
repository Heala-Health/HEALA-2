
import React from 'react';
import { EnhancedAIChat } from '@/components/chat/EnhancedAIChat';

export const AIAssistantTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Health Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Get instant health guidance and support from our AI assistant
        </p>
      </div>
      <EnhancedAIChat />
    </div>
  );
};
