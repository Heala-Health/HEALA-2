
import { useState, useEffect } from 'react';
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

export const usePatients = () => {
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
      console.log('Fetching patients for physician:', user.id);
      
      // First get physician-patient relationships
      const { data: assignedPatients, error: assignmentError } = await supabase
        .from('physician_patients')
        .select('patient_id, assigned_at')
        .eq('physician_id', user.id)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Error fetching patient assignments:', assignmentError);
        throw assignmentError;
      }

      console.log('Assigned patients data:', assignedPatients);

      if (!assignedPatients || assignedPatients.length === 0) {
        setPatients([]);
        return;
      }

      // Get patient IDs
      const patientIds = assignedPatients.map(assignment => assignment.patient_id);

      // Fetch patient profiles separately
      const { data: patientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', patientIds);

      if (profilesError) {
        console.error('Error fetching patient profiles:', profilesError);
        throw profilesError;
      }

      console.log('Patient profiles:', patientProfiles);

      // Get appointment statistics for each patient
      const patientsWithStats = await Promise.all(
        patientProfiles.map(async (patientProfile) => {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('appointment_date, created_at')
            .eq('patient_id', patientProfile.id)
            .eq('physician_id', user.id)
            .order('appointment_date', { ascending: false });

          const lastAppointment = appointments?.[0]?.appointment_date;
          const totalAppointments = appointments?.length || 0;

          return {
            id: patientProfile.id,
            first_name: patientProfile.first_name || 'Unknown',
            last_name: patientProfile.last_name || '',
            email: patientProfile.email,
            phone: patientProfile.phone,
            last_appointment: lastAppointment,
            total_appointments: totalAppointments
          };
        })
      );

      console.log('Patients with stats:', patientsWithStats);
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

  return { patients, loading, refetchPatients: fetchPatients };
};
