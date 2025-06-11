
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Car, AlertTriangle, Users } from 'lucide-react';
import { AssistedPatient } from './types';

interface PatientCardProps {
  patient: AssistedPatient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssistanceIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            {getAssistanceIcon(patient.assistance_type)}
          </div>
          <div>
            <h4 className="font-medium">{patient.patient_name}</h4>
            <p className="text-sm text-gray-600">{patient.patient_email}</p>
            <p className="text-xs text-gray-500">
              {patient.assistance_type} • {new Date(patient.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(patient.status)}>
          {patient.status}
        </Badge>
      </div>
      {patient.description && (
        <p className="text-sm text-gray-600 mt-2 ml-13">{patient.description}</p>
      )}
    </div>
  );
};
