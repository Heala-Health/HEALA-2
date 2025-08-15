
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HospitalStats {
  total_patients: number;
  total_physicians: number;
  today_appointments: number;
  pending_emergencies: number;
  active_resources: number;
  waitlist_count: number;
}

export const FixedHospitalOverview: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<HospitalStats>({
    total_patients: 0,
    total_physicians: 0,
    today_appointments: 0,
    pending_emergencies: 0,
    active_resources: 0,
    waitlist_count: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchHospitalStats = async () => {
    if (!profile?.hospital_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch total patients
      const { data: patientsData } = await supabase
        .from('hospital_patients')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('status', 'active');

      // Fetch total physicians
      const { data: physiciansData } = await supabase
        .from('profiles')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('role', 'physician')
        .eq('is_active', true);

      // Fetch today's appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('appointment_date', today);

      // Fetch pending emergencies
      const { data: emergenciesData } = await supabase
        .from('emergency_requests')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('status', 'pending');

      // Fetch active resources
      const { data: resourcesData } = await supabase
        .from('hospital_resources')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('status', 'available');

      // Fetch waitlist count
      const { data: waitlistData } = await supabase
        .from('patient_waitlist')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('status', 'waiting');

      setStats({
        total_patients: patientsData?.length || 0,
        total_physicians: physiciansData?.length || 0,
        today_appointments: appointmentsData?.length || 0,
        pending_emergencies: emergenciesData?.length || 0,
        active_resources: resourcesData?.length || 0,
        waitlist_count: waitlistData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching hospital stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchHospitalStats();
    }
  }, [profile?.hospital_id]);

  if (loading) {
    return <div className="p-6">Loading hospital overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Hospital Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_patients}</div>
            <p className="text-xs text-muted-foreground">Active patients in hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Physicians</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_physicians}</div>
            <p className="text-xs text-muted-foreground">Active medical staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today_appointments}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending_emergencies}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_resources}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlist_count}</div>
            <p className="text-xs text-muted-foreground">Patients waiting</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
