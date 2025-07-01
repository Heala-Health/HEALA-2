
import { ConsultationSession, ConnectionStatus } from '../types';

export interface UseConsultationSessionReturn {
  session: ConsultationSession | null;
  loading: boolean;
  sessionDuration: number;
  connectionStatus: ConnectionStatus;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  formatDuration: (minutes: number) => string;
}
