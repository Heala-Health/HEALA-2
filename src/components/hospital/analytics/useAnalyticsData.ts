
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsData } from './types';

export const useAnalyticsData = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData>({
    totalAppointments: 0,
    activePhysicians: 0,
    emergencyRequests: 0,
    monthlyAppointments: [],
    appointmentsByStatus: [],
    physicianWorkload: []
  });
  const [loading, setLoading] = useState(true);

  const processMonthlyAppointments = (appointments: any[]) => {
    const monthlyCount: { [key: string]: number } = {};
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyCount[monthKey] = 0;
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        appointments: 0
      });
    }

    appointments.forEach(apt => {
      const monthKey = apt.appointment_date.slice(0, 7);
      if (monthlyCount.hasOwnProperty(monthKey)) {
        monthlyCount[monthKey]++;
      }
    });

    return last6Months.map((month, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const monthKey = date.toISOString().slice(0, 7);
      return {
        ...month,
        appointments: monthlyCount[monthKey] || 0
      };
    });
  };

  const processAppointmentsByStatus = (appointments: any[]) => {
    const statusCount: { [key: string]: number } = {};
    
    appointments.forEach(apt => {
      const status = apt.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const processPhysicianWorkload = (appointments: any[], physicians: any[]) => {
    const workload: { [key: string]: number } = {};
    
    physicians.forEach(physician => {
      workload[physician.id] = 0;
    });

    appointments.forEach(apt => {
      if (workload.hasOwnProperty(apt.physician_id)) {
        workload[apt.physician_id]++;
      }
    });

    return physicians.map(physician => ({
      name: `${physician.first_name} ${physician.last_name}`,
      appointments: workload[physician.id] || 0
    })).sort((a, b) => b.appointments - a.appointments);
  };

  const fetchAnalytics = async () => {
    if (!profile?.hospital_id) return;

    setLoading(true);
    try {
      await supabase.rpc('generate_hospital_analytics', { 
        hospital_uuid: profile.hospital_id 
      });

      const [appointmentsResult, physiciansResult, emergencyResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, appointment_date, created_at')
          .eq('hospital_id', profile.hospital_id),
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician')
          .eq('is_active', true),
        supabase
          .from('emergency_requests')
          .select('id, severity, status, created_at')
          .eq('hospital_id', profile.hospital_id)
      ]);

      const appointments = appointmentsResult.data || [];
      const physicians = physiciansResult.data || [];
      const emergencies = emergencyResult.data || [];

      const monthlyData = processMonthlyAppointments(appointments);
      const statusData = processAppointmentsByStatus(appointments);
      const workloadData = processPhysicianWorkload(appointments, physicians);

      setData({
        totalAppointments: appointments.length,
        activePhysicians: physicians.length,
        emergencyRequests: emergencies.length,
        monthlyAppointments: monthlyData,
        appointmentsByStatus: statusData,
        physicianWorkload: workloadData
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchAnalytics();
    }
  }, [user, profile]);

  return { data, loading, refetch: fetchAnalytics };
};
