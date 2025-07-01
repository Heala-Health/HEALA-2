
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrescriptionInput } from './PrescriptionInput';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  last_appointment?: string;
  total_appointments: number;
}

interface PrescriptionCreationFormProps {
  patient: Patient;
  onBack: () => void;
  onPrescriptionAdded: () => void;
}

export const PrescriptionCreationForm: React.FC<PrescriptionCreationFormProps> = ({
  patient,
  onBack,
  onPrescriptionAdded
}) => {
  return (
    <div className="space-y-4">
      <Button
        onClick={onBack}
        variant="outline"
      >
        ← Back to Patients
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create Prescription for {patient.first_name} {patient.last_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold">Patient Information:</h4>
            <p>Name: {patient.first_name} {patient.last_name}</p>
            <p>Email: {patient.email}</p>
            {patient.phone && <p>Phone: {patient.phone}</p>}
            <p>Total Appointments: {patient.total_appointments}</p>
            {patient.last_appointment && (
              <p>Last Appointment: {new Date(patient.last_appointment).toLocaleDateString()}</p>
            )}
          </div>
          <PrescriptionInput
            patientId={patient.id}
            onPrescriptionAdded={onPrescriptionAdded}
          />
        </CardContent>
      </Card>
    </div>
  );
};
