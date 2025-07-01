
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Video, Plus } from 'lucide-react';

export const TestVideoSession: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const createTestVideoSession = async () => {
    try {
      console.log('Creating test session with user:', user?.id, 'profile role:', profile?.role);
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a test session.",
          variant: "destructive"
        });
        return;
      }

      if (!profile) {
        toast({
          title: "Error",
          description: "Profile not loaded. Please refresh the page.",
          variant: "destructive"
        });
        return;
      }

      // Determine patient and physician IDs based on current user role
      const patientId = profile.role === 'physician' ? '150176f3-659d-4421-8e11-81086e3b5d00' : user.id;
      const physicianId = profile.role === 'physician' ? user.id : 'c48a9b68-2144-4767-a3d1-395fab939a50';

      console.log('Patient ID:', patientId, 'Physician ID:', physicianId);

      // Create a test appointment first
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          physician_id: physicianId,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '14:00',
          consultation_type: 'virtual',
          status: 'accepted',
          notes: 'Test video consultation session'
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError);
        throw new Error(`Failed to create appointment: ${appointmentError.message}`);
      }

      console.log('Appointment created:', appointmentData);

      // Create a video consultation session with video type explicitly
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          appointment_id: appointmentData.id,
          patient_id: patientId,
          physician_id: physicianId,
          consultation_rate: 5000,
          session_type: 'video', // Explicitly set to video
          status: 'scheduled',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      console.log('Session created with type:', sessionData.session_type);

      toast({
        title: "Test Video Session Created",
        description: `Video consultation session created with ID: ${sessionData.id}. Refresh the page to see it in the list.`,
      });

      // Refresh the page after a short delay to show the new session
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Test Video Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Create a test video consultation session to test the doctor-patient flow. 
          {profile?.role === 'physician' ? ' You will be the doctor, and a test patient will be assigned.' : ' You will be the patient, and a test doctor will be assigned.'}
        </p>
        <Button onClick={createTestVideoSession} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Test Video Session
        </Button>
      </CardContent>
    </Card>
  );
};
