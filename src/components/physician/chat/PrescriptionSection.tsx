
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Pill } from 'lucide-react';
import { PatientList } from '../PatientList';
import { PrescriptionInput } from '../PrescriptionInput';
import { Patient } from './types';

interface PrescriptionSectionProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient | null) => void;
  onPrescriptionAdded: () => void;
}

export const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onPrescriptionAdded
}) => {
  return (
    <TabsContent value="prescriptions" className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <PatientList 
            patients={patients}
            onStartConversation={(patientId, patientName) => {
              const patient = patients.find(p => p.id === patientId);
              onSelectPatient(patient || null);
            }}
            actionLabel="Select for Prescription"
          />
        </div>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900">
                  Creating prescription for: {selectedPatient.first_name} {selectedPatient.last_name}
                </h3>
                <p className="text-sm text-blue-700">{selectedPatient.email}</p>
              </div>
              <PrescriptionInput 
                patientId={selectedPatient.id}
                onPrescriptionAdded={onPrescriptionAdded}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>Select a patient to create a prescription</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
};
