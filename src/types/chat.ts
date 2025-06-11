
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: 'patient' | 'physician' | 'ai_bot';
  message_type: 'text' | 'image' | 'file';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string | null;
  type: 'ai_diagnosis' | 'physician_consultation';
  title: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}
