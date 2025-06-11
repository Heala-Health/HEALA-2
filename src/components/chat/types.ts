
export interface Conversation {
  id: string;
  type: 'ai_diagnosis' | 'physician_consultation';
  title?: string;
  status: string;
  created_at: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

export interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician' | 'ai_bot';
  sender_id?: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'file';
  metadata?: any;
}
