
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '../types';
import { fetchUserAppointments, cancelAppointment as cancelAppointmentService } from '../services/appointmentService';

export const useAppointments = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const data = await fetchUserAppointments(user.id, profile.role);
      setAppointments(data);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointmentService(appointmentId);
      toast({
        title: "Success",
        description: "Appointment cancelled successfully.",
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  return {
    appointments,
    loading,
    fetchAppointments,
    cancelAppointment
  };
};
