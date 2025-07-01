
export interface Patient {
  id: string;
  patient_id: string;
  hospital_id: string;
  status: 'active' | 'discharged' | 'admitted' | 'emergency';
  admission_date: string;
  discharge_date?: string;
  room_number?: string;
  assigned_physician_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  assigned_physician_name?: string;
}

export interface PatientFormData {
  patient_id: string;
  status: string;
  room_number?: string;
  assigned_physician_id?: string;
  notes?: string;
}
