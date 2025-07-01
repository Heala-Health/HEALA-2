
export interface NotificationManagerProps {
  sessionId: string;
  userId: string;
  isPatient: boolean;
  isPhysician: boolean;
  onConsultationStarted: () => void;
  onPatientJoined: () => void;
}

export interface DatabaseChangePayload {
  new: any;
  old: any;
  eventType: string;
}

export interface BroadcastPayload {
  payload: {
    startedBy?: string;
    sessionId?: string;
    patientId?: string;
    timestamp?: string;
  };
}
