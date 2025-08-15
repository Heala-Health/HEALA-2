
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  is_active: boolean;
}

interface DashboardStats {
  total_physicians: number;
  active_physicians: number;
  total_appointments: number;
  today_appointments: number;
  total_patients: number;
  emergency_requests: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

export const useHospitalData = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_physicians: 0,
    active_physicians: 0,
    total_appointments: 0,
    today_appointments: 0,
    total_patients: 0,
    emergency_requests: 0,
    revenue_this_month: 0,
    occupancy_rate: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchHospitalData = async () => {
    if (!profile?.hospital_id) {
      console.log('No hospital_id found in profile:', profile);
      return;
    }

    try {
      const { data: hospital, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', profile.hospital_id)
        .single();

      if (error) throw error;
      setHospitalInfo(hospital);
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      toast({
        title: "Error",
        description: "Failed to load hospital information.",
        variant: "destructive"
      });
    }
  };

  const fetchDashboardStats = async () => {
    if (!profile?.hospital_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all stats in parallel
      const [
        { count: totalPhysicians },
        { count: activePhysicians },
        { count: totalAppointments },
        { count: todayAppointments },
        { count: emergencyRequests }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician')
          .eq('is_active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('appointment_date', today),
        supabase.from('emergency_requests').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('status', 'pending')
      ]);

      // Get unique patients count
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('hospital_id', profile.hospital_id);

      const uniquePatients = new Set(appointmentData?.map(a => a.patient_id) || []).size;

      setStats({
        total_physicians: totalPhysicians || 0,
        active_physicians: activePhysicians || 0,
        total_appointments: totalAppointments || 0,
        today_appointments: todayAppointments || 0,
        total_patients: uniquePatients,
        emergency_requests: emergencyRequests || 0,
        revenue_this_month: 0, // Will be calculated from financial data
        occupancy_rate: 0 // Will be calculated from patient data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'hospital_admin' && profile?.hospital_id) {
      console.log('Loading hospital data for profile:', profile);
      fetchHospitalData();
      fetchDashboardStats();
    } else if (user && profile && profile.role === 'hospital_admin' && !profile.hospital_id) {
      console.log('Hospital admin profile found but no hospital_id:', profile);
      setLoading(false);
    } else if (user && profile && profile.role !== 'hospital_admin') {
      console.log('User profile found but not hospital_admin role:', profile.role);
      setLoading(false);
    }
  }, [user, profile]);

  return {
    hospitalInfo,
    stats,
    loading,
    profile
  };
};
