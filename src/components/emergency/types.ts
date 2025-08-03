
export interface EmergencyRequest {
  id: string;
  patient_id: string;
  emergency_type: string;
  description: string;
  status: string;
  severity: string;
  created_at: string;
  updated_at: string;
  hospital_id?: string;
  assigned_physician_id?: string;
  location_latitude?: number;
  location_longitude?: number;
  pickup_address?: string;
  contact_phone?: string;
  ambulance_eta?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}
