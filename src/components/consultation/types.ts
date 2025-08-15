
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
  appointment_id?: string;
  room_status?: string;
  patient?: {
    first_name: string;
    last_name: string;
  } | null;
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  } | null;
  appointment?: {
    appointment_date: string;
    appointment_time: string;
  } | null;
  consultation_rooms?: {
    id: string;
    room_token: string;
    room_status: string;
  };
}

export interface VirtualConsultationRoomProps {
  sessionId?: string | null;
}

export interface EnhancedVirtualConsultationRoomProps {
  sessionId?: string;
  onSessionEnd?: () => void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
