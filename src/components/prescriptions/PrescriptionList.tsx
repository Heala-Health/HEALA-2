
import React from 'react';
import { Pill } from 'lucide-react';
import { PrescriptionCard } from './PrescriptionCard';
import { Prescription } from './types/prescription';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onRequestRepeat: (prescriptionId: string) => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  onRequestRepeat
}) => {
  if (prescriptions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>No prescriptions found</p>
        <p className="text-sm mt-2">Your prescriptions from doctors will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard
          key={prescription.id}
          prescription={prescription}
          onRequestRepeat={onRequestRepeat}
        />
      ))}
    </div>
  );
};
