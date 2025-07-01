
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePrescriptions } from './hooks/usePrescriptions';
import { PrescriptionList } from './PrescriptionList';
import { requestRepeat } from './services/prescriptionService';

export const PrescriptionManagement: React.FC = () => {
  const { toast } = useToast();
  const { prescriptions, loading, refetch } = usePrescriptions();

  const handleRequestRepeat = async (prescriptionId: string) => {
    try {
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;

      if (prescription.repeat_count >= prescription.max_repeats) {
        toast({
          title: "Repeat Limit Reached",
          description: "You have reached the maximum number of repeats for this prescription.",
          variant: "destructive"
        });
        return;
      }

      await requestRepeat(prescriptionId, prescription.repeat_count, prescription.max_repeats);

      toast({
        title: "Repeat Requested",
        description: "Your repeat prescription has been requested successfully."
      });

      refetch();
    } catch (error) {
      console.error('Error requesting repeat:', error);
      toast({
        title: "Error",
        description: "Failed to request repeat prescription",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading prescriptions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            My Prescriptions ({prescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PrescriptionList
            prescriptions={prescriptions}
            onRequestRepeat={handleRequestRepeat}
          />
        </CardContent>
      </Card>
    </div>
  );
};
