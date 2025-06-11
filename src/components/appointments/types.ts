
export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  physician: {
    first_name: string;
    last_name: string;
    specialization: string;
    phone?: string;
  };
  hospital?: {
    name: string;
    address?: string;
    phone?: string;
  };
}
