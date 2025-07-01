
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string;
  title: string;
  status: string;
  created_at: string;
  patient_name: string;
}
