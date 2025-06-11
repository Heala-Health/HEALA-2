
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, User } from 'lucide-react';

interface ChatListActionsProps {
  onStartAIChat: () => void;
  onStartPhysicianChat: () => void;
}

export const ChatListActions: React.FC<ChatListActionsProps> = ({
  onStartAIChat,
  onStartPhysicianChat
}) => {
  return (
    <div className="grid gap-2">
      <Button onClick={onStartAIChat} className="w-full justify-start">
        <Bot className="w-4 h-4 mr-2" />
        Start AI Health Assessment
      </Button>
      <Button 
        variant="outline" 
        onClick={onStartPhysicianChat}
        className="w-full justify-start"
      >
        <User className="w-4 h-4 mr-2" />
        Consult with Physician
      </Button>
    </div>
  );
};
