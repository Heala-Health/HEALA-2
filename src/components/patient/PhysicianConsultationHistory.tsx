import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { History, User, Stethoscope, FileText, Pill, Clock, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type PatientInteraction = Database['public']['Tables']['patient_physician_interactions']['Row'] & {
  profiles: { first_name: string; last_name: string; specialization: string; }[] | null; // Physician profile
  consultations: Database['public']['Tables']['consultations']['Row'] | null;
  prescriptions: Database['public']['Tables']['prescriptions']['Row'] & {
    prescription_data: { medication_name: string; dosage: string; instructions: string; }[];
  } | null;
};

export const PhysicianConsultationHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<PatientInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPhysicianInteractions();
    }
  }, [user]);

  const fetchPhysicianInteractions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_physician_interactions')
        .select(`
          *,
          profiles (first_name, last_name, specialization),
          consultations (
            id,
            appointment_id,
            consultation_notes,
            created_at,
            status
          ),
          prescriptions (
            id,
            prescription_data,
            created_at,
            status,
            repeat_allowed,
            repeat_count,
            max_repeats
          )
        `)
        .eq('patient_id', user.id)
        .order('interaction_date', { ascending: false });

      if (error) throw error;

      // Explicitly cast data to handle Supabase type inference quirks
      const typedData = data as unknown as PatientInteraction[];

      // Group interactions by physician
      const groupedByPhysician: { [physicianId: string]: PatientInteraction[] } = {};
      typedData.forEach(interaction => {
        const physicianId = interaction.physician_id;
        if (!groupedByPhysician[physicianId]) {
          groupedByPhysician[physicianId] = [];
        }
        groupedByPhysician[physicianId].push(interaction);
      });

      // Convert grouped object back to an array for rendering
      const sortedPhysicians = Object.values(groupedByPhysician).flatMap(physicianInteractions => {
        // Sort interactions for each physician by date
        return physicianInteractions.sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime());
      });

      setInteractions(sortedPhysicians);
    } catch (error) {
      console.error('Error fetching physician interactions:', error);
      toast({
        title: "Error",
        description: "Failed to load physician consultation history.",
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
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Physician History...</CardTitle></CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  const physiciansWithInteractions = Array.from(new Set(interactions.map(i => i.physician_id)))
    .map(physicianId => interactions.find(i => i.physician_id === physicianId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          My Physician History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {physiciansWithInteractions.length === 0 ? (
          <p className="text-gray-500">No physician interaction history found.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {physiciansWithInteractions.map((physician, index) => (
              physician && (
                <AccordionItem key={physician.physician_id} value={`item-${index}`}>
                  <AccordionTrigger className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">
                        Dr. {physician.profiles?.[0]?.first_name} {physician.profiles?.[0]?.last_name} ({physician.profiles?.[0]?.specialization})
                      </span>
                    </div>
                    <Badge variant="secondary">{
                      interactions.filter(i => i.physician_id === physician.physician_id).length
                    } Interactions</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t">
                    <h4 className="font-semibold mb-3 text-md">Interactions:</h4>
                    {interactions
                      .filter(i => i.physician_id === physician.physician_id)
                      .map((interaction) => (
                        <div key={interaction.id} className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                            <History className="w-3 h-3" />
                            Type: <Badge variant="outline">{interaction.interaction_type}</Badge>
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            Date: {format(new Date(interaction.interaction_date), 'PPP')}
                          </p>
                          {interaction.interaction_type === 'consultation' && interaction.consultations && (
                            <>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                                <Stethoscope className="w-3 h-3" />
                                Status: <Badge variant="outline">{interaction.consultations.status}</Badge>
                              </p>
                              <p className="text-sm text-gray-700 flex items-start gap-1">
                                <FileText className="w-3 h-3 mt-1" />
                                Notes: {interaction.consultations.consultation_notes || 'No notes provided.'}
                              </p>
                            </>
                          )}
                          {interaction.interaction_type === 'prescription' && interaction.prescriptions && (
                            <>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                                <Pill className="w-3 h-3" />
                                Medication: {interaction.prescriptions.prescription_data?.[0]?.medication_name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                                <FileText className="w-3 h-3" />
                                Dosage: {interaction.prescriptions.prescription_data?.[0]?.dosage || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-700 flex items-start gap-1">
                                <FileText className="w-3 h-3 mt-1" />
                                Instructions: {interaction.prescriptions.prescription_data?.[0]?.instructions || 'No specific instructions.'}
                              </p>
                              {interaction.prescriptions.repeat_allowed && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" />
                                  Repeats: {interaction.prescriptions.repeat_count}/{interaction.prescriptions.max_repeats}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              )
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
