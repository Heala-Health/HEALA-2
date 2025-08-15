
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

  useEffect(() => {
    if (user) {
      loadPendingAppointments();
    }
  }, [user]);

  const handleAcceptedAppointment = async (appointment: PendingAppointment) => {
    await createPhysicianPatientRelationship(user?.id!, appointment.patient_id);
    
    if (appointment.consultation_type === 'virtual') {
      await handleVirtualConsultation(appointment);
    } else {
      handleInPersonConsultation(appointment);
    }
  };

  const handleVirtualConsultation = async (appointment: PendingAppointment) => {
    try {
      const sessionData = await createConsultationSession(
        appointment, 
        user?.id!, 
        profile?.current_consultation_rate || 5000
      );
      
      toast({
        title: "🎥 Virtual Consultation Created!",
        description: `Video consultation session created for ${appointment.patient.first_name} ${appointment.patient.last_name}. You can now start the session from the Virtual Consultation tab.`,
        duration: 8000,
      });

      await createConversation(
        appointment.patient_id,
        user?.id!,
        `${appointment.patient.first_name} ${appointment.patient.last_name}`
      );
    } catch (sessionError) {
      toast({
        title: "⚠️ Virtual Session Issue",
        description: `Appointment accepted but failed to create video consultation session: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}. Please try creating the session manually from the Virtual Consultation tab.`,
        variant: "destructive",
        duration: 10000,
      });
    }
  };

  const handleInPersonConsultation = (appointment: PendingAppointment) => {
    toast({
      title: "✅ Appointment Accepted",
      description: `In-person appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been accepted.`,
    });
  };

  const handleRejectedAppointment = (appointment: PendingAppointment) => {
    toast({
      title: "❌ Appointment Rejected",
      description: `Appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been rejected.`,
    });
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'accepted' | 'rejected', appointment: PendingAppointment) => {
    if (processingAppointments.has(appointmentId)) return;

    setProcessingAppointments(prev => new Set(prev).add(appointmentId));

    try {
      await updateAppointmentStatus(appointmentId, action);

      if (action === 'accepted') {
        await handleAcceptedAppointment(appointment);
      } else {
        handleRejectedAppointment(appointment);
      }

      await loadPendingAppointments();
    } catch (error) {
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
