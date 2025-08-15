
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MessageCircle } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PatientListProps {
  patients: Patient[];
  onStartConversation: (patientId: string, patientName: string) => void;
  actionLabel?: string;
}

export const PatientList: React.FC<PatientListProps> = ({ 
  patients, 
  onStartConversation,
  actionLabel = "Start Chat"
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          My Patients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No patients assigned</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((patient) => {
              const fullName = `${patient.first_name} ${patient.last_name}`;
              return (
                <div
                  key={patient.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {fullName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.email}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onStartConversation(patient.id, fullName)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
