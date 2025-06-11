import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { History, User, Stethoscope, FileText, Calendar } from 'lucide-react'; // Added Calendar
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type PatientInteraction = Database['public']['Tables']['patient_physician_interactions']['Row'] & {
  profiles: { first_name: string; last_name: string; }[] | null; // Changed to array
  consultations: Database['public']['Tables']['consultations']['Row'] | null;
};

export const PatientConsultationHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<PatientInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatientInteractions();
    }
  }, [user]);

  const fetchPatientInteractions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_physician_interactions')
        .select(`
          *,
          profiles (first_name, last_name),
          consultations (
            id,
            appointment_id,
            consultation_notes,
            created_at,
            status
          )
        `)
        .eq('physician_id', user.id)
        .order('interaction_date', { ascending: false });

      if (error) throw error;

      // Explicitly cast data to handle Supabase type inference quirks
      const typedData = data as unknown as PatientInteraction[];

      // Group interactions by patient
      const groupedByPatient: { [patientId: string]: PatientInteraction[] } = {};
      typedData.forEach(interaction => {
        const patientId = interaction.patient_id;
        if (!groupedByPatient[patientId]) {
          groupedByPatient[patientId] = [];
        }
        groupedByPatient[patientId].push(interaction);
      });

      // Convert grouped object back to an array for rendering
      const sortedPatients = Object.values(groupedByPatient).flatMap(patientInteractions => {
        // Sort consultations for each patient by date
        return patientInteractions.sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime());
      });

      setInteractions(sortedPatients);
    } catch (error) {
      console.error('Error fetching patient interactions:', error);
      toast({
        title: "Error",
        description: "Failed to load patient consultation history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Patient History...</CardTitle></CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  const patientsWithInteractions = Array.from(new Set(interactions.map(i => i.patient_id)))
    .map(patientId => interactions.find(i => i.patient_id === patientId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Patient Consultation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patientsWithInteractions.length === 0 ? (
          <p className="text-gray-500">No patient consultation history found.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {patientsWithInteractions.map((patient, index) => (
              patient && (
                <AccordionItem key={patient.patient_id} value={`item-${index}`}>
                  <AccordionTrigger className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">
                        {patient.profiles?.[0]?.first_name} {patient.profiles?.[0]?.last_name}
                      </span>
                    </div>
                    <Badge variant="secondary">{
                      interactions.filter(i => i.patient_id === patient.patient_id && i.interaction_type === 'consultation').length
                    } Consultations</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t">
                    <h4 className="font-semibold mb-3 text-md">Consultations:</h4>
                    {interactions
                      .filter(i => i.patient_id === patient.patient_id && i.interaction_type === 'consultation')
                      .map((consultationInteraction) => (
                        consultationInteraction.consultations && (
                          <div key={consultationInteraction.id} className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                              <Calendar className="w-3 h-3" />
                              Date: {format(new Date(consultationInteraction.consultations.created_at), 'PPP')}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                              <Stethoscope className="w-3 h-3" />
                              Status: <Badge variant="outline">{consultationInteraction.consultations.status}</Badge>
                            </p>
                            <p className="text-sm text-gray-700 flex items-start gap-1">
                              <FileText className="w-3 h-3 mt-1" />
                              Notes: {consultationInteraction.consultations.consultation_notes || 'No notes provided.'}
                            </p>
                          </div>
                        )
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
