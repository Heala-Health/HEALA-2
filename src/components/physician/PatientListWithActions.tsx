
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Calendar, FileText, Pill } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  last_appointment?: string;
  total_appointments: number;
}

interface PatientListWithActionsProps {
  patients: Patient[];
  onStartChat: (patientId: string, patientName: string) => void;
  onPrescribe: (patientId: string) => void;
}

export const PatientListWithActions: React.FC<PatientListWithActionsProps> = ({
  patients,
  onStartChat,
  onPrescribe
}) => {
  if (patients.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No patients assigned yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Patients will be assigned when you accept their appointments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <div key={patient.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">
                {patient.first_name} {patient.last_name}
              </h4>
              <p className="text-sm text-gray-600">{patient.email}</p>
              {patient.phone && (
                <p className="text-sm text-gray-500">Phone: {patient.phone}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {patient.total_appointments} appointments
                  </span>
                </div>
                {patient.last_appointment && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Last: {new Date(patient.last_appointment).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-col">
              <Button
                size="sm"
                onClick={() => onStartChat(patient.id, `${patient.first_name} ${patient.last_name}`)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPrescribe(patient.id)}
              >
                <Pill className="w-4 h-4 mr-2" />
                Prescribe
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
