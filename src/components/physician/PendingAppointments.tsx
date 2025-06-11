import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, CheckCircle, XCircle, Calendar, User } from 'lucide-react';

import { Database } from '@/integrations/supabase/types';

interface Appointment {
  id: string;
  patient_id: string;
  physician_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  status: Database['public']['Enums']['appointment_status'];
  consultation_type: Database['public']['Enums']['consultation_type'];
  profiles: { // Changed from 'patients' to 'profiles'
    first_name: string;
    last_name: string;
  }[] | null; // Changed to array
}

export const PendingAppointments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingAppointments();
    }
  }, [user]);

  const fetchPendingAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          consultation_type,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('physician_id', user.id)
        .eq('status', 'pending')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setPendingAppointments(data as Appointment[]);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load pending appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointment: Appointment, status: 'accepted' | 'rejected') => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: status === 'accepted' ? 'completed' : 'cancelled' }) // Mark as completed if accepted, cancelled if rejected
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        // Create a consultation record
        const { data: consultationData, error: consultationError } = await supabase
          .from('consultations')
          .insert({
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            physician_id: appointment.physician_id,
            consultation_notes: appointment.notes, // Use appointment notes as initial consultation notes
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (consultationError) throw consultationError;
        const consultationId = consultationData[0].id;

        // Record interaction for both patient and physician
        const { error: interactionError } = await supabase
          .from('patient_physician_interactions')
          .insert({
            patient_id: appointment.patient_id,
            physician_id: appointment.physician_id,
            consultation_id: consultationId,
            interaction_type: 'consultation',
            interaction_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (interactionError) throw interactionError;

        if (appointment.consultation_type === 'virtual') {
          await createChatConversation(appointment.patient_id, user?.id as string);
        }
      }

      toast({
        title: `Appointment ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
        description: `The appointment has been successfully ${status}.`,
      });
      fetchPendingAppointments(); // Refresh the list
    } catch (error) {
      console.error(`Error ${status} appointment:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} appointment. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createChatConversation = async (patientId: string, physicianId: string) => {
    try {
      // Check if a conversation already exists between these two users
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(patient_id.eq.${patientId},physician_id.eq.${physicianId}),and(patient_id.eq.${physicianId},physician_id.eq.${patientId})`);

      if (fetchError) throw fetchError;

      if (existingConversations && existingConversations.length > 0) {
        console.log('Chat conversation already exists:', existingConversations[0].id);
        toast({
          title: "Chat Conversation Exists",
          description: "A chat conversation for this patient already exists.",
        });
        return existingConversations[0].id;
      }

      // Create a new chat conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          physician_id: physicianId,
          type: 'physician_consultation', // Assuming this type is appropriate for physician-patient chats
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      toast({
        title: "Chat Conversation Created",
        description: "A new chat conversation has been created for the virtual consultation.",
      });
      return data[0].id;
    } catch (error) {
      console.error('Error creating chat conversation:', error);
      toast({
        title: "Chat Conversation Error",
        description: "Failed to create chat conversation.",
        variant: "destructive"
      });
      return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Pending Appointments...</CardTitle></CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Pending Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAppointments.length === 0 ? (
          <p className="text-gray-500">No pending appointments.</p>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {appointment.profiles?.[0]?.first_name} {appointment.profiles?.[0]?.last_name}
                  </h3>
                  <Badge variant={appointment.consultation_type === 'virtual' ? 'outline' : 'default'}>
                    {appointment.consultation_type === 'virtual' ? 'Virtual' : 'In-person'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <Calendar className="inline-block w-3 h-3 mr-1" />
                  Date: {format(new Date(appointment.appointment_date), 'PPP')}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <MessageSquare className="inline-block w-3 h-3 mr-1" />
                  Time: {appointment.appointment_time}
                </p>
                {appointment.notes && (
                  <p className="text-sm text-gray-700 italic mb-3">Notes: "{appointment.notes}"</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAppointmentAction(appointment, 'accepted')}
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Accept
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAppointmentAction(appointment, 'rejected')}
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
