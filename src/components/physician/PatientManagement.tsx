
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  last_appointment?: string;
  total_appointments: number;
}

interface PatientManagementProps {
  onStartChat?: (patientId: string, patientName: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({ onStartChat }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      // Get patients assigned to this physician through physician_patients table
      const { data: assignedPatients, error: assignmentError } = await supabase
        .from('physician_patients')
        .select('patient_id')
        .eq('physician_id', user.id)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Error fetching patient assignments:', assignmentError);
        setPatients([]);
        setLoading(false);
        return;
      }

      if (!assignedPatients || assignedPatients.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      const patientIds = assignedPatients.map(p => p.patient_id);

      // Fetch patient profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', patientIds)
        .eq('role', 'patient');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setPatients([]);
        setLoading(false);
        return;
      }

      // Get appointment statistics for each patient
      const patientsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('appointment_date, created_at')
            .eq('patient_id', profile.id)
            .eq('physician_id', user.id)
            .order('appointment_date', { ascending: false });

          const lastAppointment = appointments?.[0]?.appointment_date;
          const totalAppointments = appointments?.length || 0;

          return {
            id: profile.id,
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || '',
            email: profile.email,
            phone: profile.phone,
            last_appointment: lastAppointment,
            total_appointments: totalAppointments
          };
        })
      );

      setPatients(patientsWithStats);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (patientId: string, patientName: string) => {
    try {
      // Create or get existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('patient_id', patientId)
        .eq('physician_id', user?.id)
        .eq('type', 'physician_consultation')
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            patient_id: patientId,
            physician_id: user?.id,
            type: 'physician_consultation',
            title: `Consultation with ${patientName}`,
            status: 'active'
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConversation.id;
      }

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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading patients...</div>
        </CardContent>
      </Card>
    );
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
        {patients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients assigned yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Patients can request assignment to you from their dashboard
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {patient.first_name} {patient.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-sm text-gray-500">Phone: {patient.phone}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {patient.total_appointments} appointments
                        </span>
                      </div>
                      {patient.last_appointment && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Last: {new Date(patient.last_appointment).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => startConversation(patient.id, `${patient.first_name} ${patient.last_name}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
