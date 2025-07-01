
export interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician';
  sender_id: string;
  is_read: boolean;
  read_at?: string;
  message_attachments?: any;
  created_at: string;
}

export interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
}

export interface EnhancedChatProps {
  conversationId: string;
  onBack: () => void;
}
