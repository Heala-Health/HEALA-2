
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrescriptionInput } from '../PrescriptionInput';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface PrescriptionCreationViewProps {
  appointment: PendingAppointment;
  onBack: () => void;
  onPrescriptionAdded: () => void;
}

export const PrescriptionCreationView: React.FC<PrescriptionCreationViewProps> = ({
  appointment,
  onBack,
  onPrescriptionAdded
}) => {
  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="outline">
        ← Back to Appointments
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create Prescription for {appointment.patient.first_name} {appointment.patient.last_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold">Patient Information:</h4>
            <p>Name: {appointment.patient.first_name} {appointment.patient.last_name}</p>
            <p>Email: {appointment.patient.email}</p>
            {appointment.patient.phone && <p>Phone: {appointment.patient.phone}</p>}
            <p>Appointment: {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}</p>
          </div>
          <PrescriptionInput
            patientId={appointment.patient_id}
            appointmentId={appointment.id}
            onPrescriptionAdded={onPrescriptionAdded}
          />
        </CardContent>
      </Card>
    </div>
  );
};
