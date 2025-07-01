
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePatients } from './hooks/usePatients';
import { PatientListWithActions } from './PatientListWithActions';
import { PrescriptionCreationForm } from './PrescriptionCreationForm';
import { startConversation } from './services/conversationService';

interface PatientManagementProps {
  onStartChat?: (patientId: string, patientName: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({ onStartChat }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { patients, loading } = usePatients();
  const [showPrescriptionFor, setShowPrescriptionFor] = useState<string | null>(null);

  const handleStartConversation = async (patientId: string, patientName: string) => {
    if (!user) return;

    try {
      const conversationId = await startConversation(patientId, patientName, user.id);

      if (onStartChat) {
        onStartChat(conversationId, patientName);
      }

      toast({
        title: "Chat Started",
        description: `Started conversation with ${patientName}`,
      });

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  const handlePrescriptionAdded = () => {
    setShowPrescriptionFor(null);
    toast({
      title: "Success",
      description: "Prescription created successfully!",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading patients...</div>
        </CardContent>
      </Card>
    );
  }

  if (showPrescriptionFor) {
    const patient = patients.find(p => p.id === showPrescriptionFor);
    if (patient) {
      return (
        <PrescriptionCreationForm
          patient={patient}
          onBack={() => setShowPrescriptionFor(null)}
          onPrescriptionAdded={handlePrescriptionAdded}
        />
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Patients ({patients.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PatientListWithActions
          patients={patients}
          onStartChat={handleStartConversation}
          onPrescribe={setShowPrescriptionFor}
        />
      </CardContent>
    </Card>
  );
};
