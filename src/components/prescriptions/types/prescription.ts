
export type PrescriptionStatus = 'pending' | 'approved' | 'dispensed' | 'completed' | 'cancelled';

export interface PhysicianInfo {
  first_name: string;
  last_name: string;
  specialization?: string;
}

export interface PharmacyInfo {
  name: string;
  address: string;
  phone: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  physician_id: string;
  appointment_id?: string;
  prescription_data: any;
  status: PrescriptionStatus;
  pharmacy_id?: string;
  dispensed_at?: string;
  repeat_allowed: boolean;
  repeat_count: number;
  max_repeats: number;
  created_at: string;
  updated_at: string;
  physician?: PhysicianInfo;
  pharmacy?: PharmacyInfo;
}
