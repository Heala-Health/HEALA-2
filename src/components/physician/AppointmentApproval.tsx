
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AppointmentCard } from './appointment-approval/AppointmentCard';
import { PrescriptionCreationView } from './appointment-approval/PrescriptionCreationView';
import { fetchPendingAppointments } from './appointment-approval/appointmentService';
import {
  createConsultationSession,
  updateAppointmentStatus,
  createPhysicianPatientRelationship,
  createConversation
} from './appointment-approval/appointmentActions';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export const AppointmentApproval: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionFor, setShowPrescriptionFor] = useState<string | null>(null);
  const [processingAppointments, setProcessingAppointments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadPendingAppointments();
    }
  }, [user]);

  const loadPendingAppointments = async () => {
    if (!user) return;

    try {
      const appointments = await fetchPendingAppointments(user.id);
      setPendingAppointments(appointments);
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

  const handleAppointmentAction = async (appointmentId: string, action: 'accepted' | 'rejected', appointment: PendingAppointment) => {
    // Prevent duplicate processing
    if (processingAppointments.has(appointmentId)) {
      return;
    }

    setProcessingAppointments(prev => new Set(prev).add(appointmentId));

    try {
      console.log('🔄 [AppointmentApproval] Processing appointment action:', { appointmentId, action });

      await updateAppointmentStatus(appointmentId, action);

      if (action === 'accepted') {
        await createPhysicianPatientRelationship(user?.id!, appointment.patient_id);

        if (appointment.consultation_type === 'virtual') {
          try {
            console.log('📹 [AppointmentApproval] Creating virtual consultation session');
            
            const sessionData = await createConsultationSession(
              appointment, 
              user?.id!, 
              profile?.current_consultation_rate || 5000
            );
            
            console.log('✅ [AppointmentApproval] Virtual consultation session created successfully:', sessionData);
            
            toast({
              title: "🎥 Virtual Consultation Created!",
              description: `Video consultation session created for ${appointment.patient.first_name} ${appointment.patient.last_name}. You can now start the session from the Virtual Consultation tab.`,
              duration: 8000,
            });

            // Also create conversation for messaging
            await createConversation(
              appointment.patient_id,
              user?.id!,
              `${appointment.patient.first_name} ${appointment.patient.last_name}`
            );

          } catch (sessionError) {
            console.error('❌ [AppointmentApproval] Error creating virtual consultation session:', sessionError);
            
            toast({
              title: "⚠️ Virtual Session Issue",
              description: `Appointment accepted but failed to create video consultation session: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}. Please try creating the session manually from the Virtual Consultation tab.`,
              variant: "destructive",
              duration: 10000,
            });
          }
        } else {
          console.log('📅 [AppointmentApproval] In-person appointment accepted');
          
          toast({
            title: "✅ Appointment Accepted",
            description: `In-person appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been accepted.`,
          });
        }
      } else {
        console.log('❌ [AppointmentApproval] Appointment rejected');
        
        toast({
          title: "❌ Appointment Rejected",
          description: `Appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been rejected.`,
        });
      }

      // Reload appointments to reflect changes
      await loadPendingAppointments();

    } catch (error) {
      console.error('💥 [AppointmentApproval] Fatal error updating appointment:', error);
      
      toast({
        title: "Error",
        description: `Failed to ${action === 'accepted' ? 'accept' : 'reject'} appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setProcessingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handlePrescriptionCreated = () => {
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
          <div className="text-center">Loading pending appointments...</div>
        </CardContent>
      </Card>
    );
  }

  if (showPrescriptionFor) {
    const appointment = pendingAppointments.find(apt => apt.id === showPrescriptionFor);
    if (appointment) {
      return (
        <PrescriptionCreationView
          appointment={appointment}
          onBack={() => setShowPrescriptionFor(null)}
          onPrescriptionAdded={handlePrescriptionCreated}
        />
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Appointments ({pendingAppointments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending appointments to review
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onAccept={(id, apt) => handleAppointmentAction(id, 'accepted', apt)}
                onReject={(id, apt) => handleAppointmentAction(id, 'rejected', apt)}
                onPrescribe={setShowPrescriptionFor}
                isProcessing={processingAppointments.has(appointment.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
