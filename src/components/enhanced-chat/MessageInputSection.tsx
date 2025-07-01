
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Camera, Mic } from 'lucide-react';

interface MessageInputSectionProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  disabled: boolean;
}

export const MessageInputSection: React.FC<MessageInputSectionProps> = ({
  onSendMessage,
  onTyping,
  disabled
}) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
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
            onTyping();
          }}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={disabled}
        />
        <Button variant="ghost" size="sm">
          <Mic className="w-4 h-4" />
        </Button>
        <Button 
          onClick={handleSend} 
          disabled={!newMessage.trim() || disabled}
          size="sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
