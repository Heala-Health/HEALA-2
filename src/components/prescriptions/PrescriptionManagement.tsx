import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Prescription {
  id: string;
  patient_id: string;
  physician_id: string;
  appointment_id?: string;
  prescription_data: any;
  status: 'pending' | 'approved' | 'dispensed' | 'completed' | 'cancelled';
  pharmacy_id?: string;
  dispensed_at?: string;
  repeat_allowed: boolean;
  repeat_count: number;
  max_repeats: number;
  created_at: string;
  updated_at: string;
  pharmacy?: {
    name: string;
    address: string;
    phone: string;
  };
}

export const PrescriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions' as any)
        .select(`
          *,
          pharmacy:healthcare_providers(name, address, phone)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Validate data structure
      const validPrescriptions = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 'id' in item
      ).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        physician_id: item.physician_id,
        appointment_id: item.appointment_id,
        prescription_data: item.prescription_data || {},
        status: item.status || 'pending',
        pharmacy_id: item.pharmacy_id,
        dispensed_at: item.dispensed_at,
        repeat_allowed: Boolean(item.repeat_allowed),
        repeat_count: item.repeat_count || 0,
        max_repeats: item.max_repeats || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        pharmacy: item.pharmacy
      }));
      
      setPrescriptions(validPrescriptions as Prescription[]);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestRepeat = async (prescriptionId: string) => {
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

      const { error } = await supabase
        .from('prescriptions' as any)
        .update({
          repeat_count: prescription.repeat_count + 1,
          status: 'pending'
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      toast({
        title: "Repeat Requested",
        description: "Your repeat prescription has been requested successfully."
      });

      fetchPrescriptions();
    } catch (error) {
      console.error('Error requesting repeat:', error);
      toast({
        title: "Error",
        description: "Failed to request repeat prescription",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            My Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No prescriptions found
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">
                        {prescription.prescription_data?.medication_name || 'Prescription'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {prescription.prescription_data?.dosage}
                      </p>
                    </div>
                    <Badge className={getStatusColor(prescription.status)}>
                      {prescription.status}
                    </Badge>
                  </div>
                  
                  {prescription.pharmacy && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      {prescription.pharmacy.name} - {prescription.pharmacy.address}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                      {prescription.repeat_allowed && (
                        <span>
                          Repeats: {prescription.repeat_count}/{prescription.max_repeats}
                        </span>
                      )}
                    </div>
                    
                    {prescription.repeat_allowed && 
                     prescription.repeat_count < prescription.max_repeats &&
                     prescription.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestRepeat(prescription.id)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Request Repeat
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
