
export interface ConsultationSession {
  id: string;
  patient_id: string;
  physician_id: string;
  status: string;
  session_type: string;
  consultation_rate: number;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  payment_status: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  } | null;
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  } | null;
}

export interface VirtualConsultationRoomProps {
  sessionId?: string | null;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
