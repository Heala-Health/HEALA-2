import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, User, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';
import { Medication } from './types/prescription'; // Import Medication type

type Prescription = Database['public']['Tables']['prescriptions']['Row'] & {
  profiles: { first_name: string; last_name: string; }[] | null; // Patient profile
  prescription_data: Medication[]; // Specify prescription_data as an array of Medication
};

export const PhysicianPrescriptionHistory: React.FC = () => {
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
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq('physician_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPrescriptions(data as unknown as Prescription[]);
    } catch (error) {
      console.error('Error fetching physician prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load your prescription history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          <div className="text-center">Loading prescription history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          My Prescriptions History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No prescriptions found.
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient: {prescription.profiles?.[0]?.first_name} {prescription.profiles?.[0]?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Medication: {prescription.prescription_data?.[0]?.medication_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dosage: {prescription.prescription_data?.[0]?.dosage || 'N/A'}
                    </p>
                  </div>
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Prescribed On: {format(new Date(prescription.created_at), 'PPP')}
                  </span>
                  {prescription.repeat_allowed && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Repeats: {prescription.repeat_count}/{prescription.max_repeats}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Instructions: {prescription.prescription_data?.[0]?.instructions || 'No specific instructions.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
