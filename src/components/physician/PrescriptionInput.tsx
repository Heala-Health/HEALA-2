
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MedicationForm } from './MedicationForm';
import { PrescriptionSettings } from './PrescriptionSettings';
import { createPrescription } from './services/prescriptionService';
import { Medication, PrescriptionInputProps } from './types/prescription';

export const PrescriptionInput: React.FC<PrescriptionInputProps> = ({
  patientId,
  appointmentId,
  onPrescriptionAdded
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([{
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }]);
  const [repeatAllowed, setRepeatAllowed] = useState(false);
  const [maxRepeats, setMaxRepeats] = useState(0);
  const [pharmacyId, setPharmacyId] = useState('');

  const addMedication = () => {
    setMedications([...medications, {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const resetForm = () => {
    setMedications([{
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
    setRepeatAllowed(false);
    setMaxRepeats(0);
    setPharmacyId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId) return;

    setLoading(true);
    try {
      await createPrescription(
        patientId,
        user.id,
        appointmentId,
        medications,
        repeatAllowed,
        maxRepeats,
        pharmacyId
      );

      toast({
        title: "Prescription Created",
        description: "The prescription has been successfully created for the patient."
      });

      resetForm();

      if (onPrescriptionAdded) {
        onPrescriptionAdded();
      }

    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Create Prescription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {medications.map((medication, index) => (
            <MedicationForm
              key={index}
              medication={medication}
              index={index}
              onUpdate={updateMedication}
              onRemove={removeMedication}
              canRemove={medications.length > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addMedication}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Medication
          </Button>

          <PrescriptionSettings
            repeatAllowed={repeatAllowed}
            maxRepeats={maxRepeats}
            onRepeatAllowedChange={setRepeatAllowed}
            onMaxRepeatsChange={setMaxRepeats}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Prescription...' : 'Create Prescription'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
