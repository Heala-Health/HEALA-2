
export interface WaitlistEntry {
  id: string;
  patient_id: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  estimated_wait_time: number;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
}
