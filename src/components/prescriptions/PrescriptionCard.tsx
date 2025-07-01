
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, RefreshCw, User, Download } from 'lucide-react';
import { Prescription, PrescriptionStatus } from './types/prescription';

interface PrescriptionCardProps {
  prescription: Prescription;
  onRequestRepeat: (prescriptionId: string) => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onRequestRepeat
}) => {
  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMedicationsList = (prescriptionData: any) => {
    if (prescriptionData.medications && Array.isArray(prescriptionData.medications)) {
      return prescriptionData.medications;
    }
    return [];
  };

  const medications = getMedicationsList(prescription.prescription_data);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">
              Dr. {prescription.physician?.first_name} {prescription.physician?.last_name}
            </span>
            {prescription.physician?.specialization && (
              <span className="text-sm text-gray-500">
                ({prescription.physician.specialization})
              </span>
            )}
          </div>
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date(prescription.created_at).toLocaleDateString()}
        </div>
      </div>
      
      {medications.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-sm mb-2">Medications ({medications.length}):</h5>
          <div className="space-y-2">
            {medications.map((medication: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="font-medium">{medication.medication_name}</div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-1">
                  <span>Dosage: {medication.dosage}</span>
                  <span>Frequency: {medication.frequency}</span>
                  <span>Duration: {medication.duration}</span>
                </div>
                {medication.instructions && (
                  <div className="text-sm text-gray-600 mt-1">
                    Instructions: {medication.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {prescription.pharmacy && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          {prescription.pharmacy.name} - {prescription.pharmacy.address}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {prescription.repeat_allowed && (
            <span>
              Repeats: {prescription.repeat_count}/{prescription.max_repeats}
            </span>
          )}
          {prescription.status === 'pending' && (
            <span className="text-orange-600 font-medium">
              Waiting for pharmacy approval
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {prescription.repeat_allowed && 
           prescription.repeat_count < prescription.max_repeats &&
           prescription.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRequestRepeat(prescription.id)}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Request Repeat
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
