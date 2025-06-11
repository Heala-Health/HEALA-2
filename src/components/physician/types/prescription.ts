
export interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  [key: string]: string; // Index signature for Json compatibility
}

export interface PrescriptionInputProps {
  patientId?: string;
  appointmentId?: string;
  onPrescriptionAdded?: () => void;
}
