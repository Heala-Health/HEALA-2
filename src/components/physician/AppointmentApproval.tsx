
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
    try {
      await updateAppointmentStatus(appointmentId, action);

      if (action === 'accepted') {
        await createPhysicianPatientRelationship(user?.id!, appointment.patient_id);

        if (appointment.consultation_type === 'virtual') {
          try {
            await createConsultationSession(appointment, user?.id!, profile?.current_consultation_rate || 5000);
            
            toast({
              title: "Virtual Consultation Scheduled",
              description: `Video consultation session created for ${appointment.patient.first_name} ${appointment.patient.last_name}. You can now start the session from the Virtual Consultation tab.`,
            });
          } catch (sessionError) {
            console.error('Error creating consultation session:', sessionError);
            toast({
              title: "Warning",
              description: "Appointment accepted but failed to create consultation session. Please try again from the Virtual Consultation tab.",
              variant: "destructive"
            });
          }

          await createConversation(
            appointment.patient_id,
            user?.id!,
            `${appointment.patient.first_name} ${appointment.patient.last_name}`
          );
        } else {
          toast({
            title: "Appointment Accepted",
            description: `In-person appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been accepted.`,
          });
        }
      } else {
        toast({
          title: "Appointment Rejected",
          description: `Appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been rejected.`,
        });
      }

      loadPendingAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
