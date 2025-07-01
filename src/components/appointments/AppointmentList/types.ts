
export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  consultation_type: string;
  patient_id?: string;
  physician_id?: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AppointmentListProps {
  // Component can be used standalone or with external data
  externalAppointments?: Appointment[];
  onRefresh?: () => void;
}
