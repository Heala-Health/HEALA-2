
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string;
  title: string;
  status: string;
  created_at: string;
  patient_name: string; // Added this required property
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}
