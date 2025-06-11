
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Activity, UserPlus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HospitalStats {
  activePhysicians: number;
  todayAppointments: number;
  capacityUtilization: number;
  newPatientsToday: number;
}

interface PhysicianInfo {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  is_active: boolean;
  patient_count: number;
}

export const HospitalOverview: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<HospitalStats>({
    activePhysicians: 0,
    todayAppointments: 0,
    capacityUtilization: 0,
    newPatientsToday: 0
  });
  const [physicians, setPhysicians] = useState<PhysicianInfo[]>([]);

  useEffect(() => {
    if (user) {
      fetchHospitalStats();
      fetchPhysicians();
    }
  }, [user]);

  const fetchHospitalStats = async () => {
    if (!user) return;

    try {
      // Get hospital ID from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hospital_id) return;

      const today = new Date().toISOString().split('T')[0];

      const [physiciansResult, appointmentsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician')
          .eq('is_active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('appointment_date', today)
      ]);

      setStats({
        activePhysicians: physiciansResult.count || 0,
        todayAppointments: appointmentsResult.count || 0,
        capacityUtilization: Math.floor(Math.random() * 20) + 80, // Mock data
        newPatientsToday: Math.floor(Math.random() * 15) + 5 // Mock data
      });
    } catch (error) {
      console.error('Error fetching hospital stats:', error);
    }
  };

  const fetchPhysicians = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hospital_id) return;

      const { data: physiciansData, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization, is_active')
        .eq('hospital_id', profile.hospital_id)
        .eq('role', 'physician');

      if (error) throw error;

      // Get patient count for each physician
      const physiciansWithPatients = await Promise.all(
        (physiciansData || []).map(async (physician) => {
          const { count } = await supabase
            .from('physician_patients')
            .select('*', { count: 'exact', head: true })
            .eq('physician_id', physician.id)
            .eq('status', 'active');

          return {
            ...physician,
            patient_count: count || 0
          };
        })
      );

      setPhysicians(physiciansWithPatients);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const togglePhysicianStatus = async (physicianId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', physicianId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Physician status updated successfully.`,
      });

      fetchPhysicians();
      fetchHospitalStats();
    } catch (error) {
      console.error('Error updating physician status:', error);
      toast({
        title: "Error",
        description: "Failed to update physician status.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.activePhysicians}</div>
              <div className="text-sm text-gray-600">Active Physicians</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              <div className="text-sm text-gray-600">Today's Appointments</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats.capacityUtilization}%</div>
              <div className="text-sm text-gray-600">Capacity Utilization</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{stats.newPatientsToday}</div>
              <div className="text-sm text-gray-600">New Patients Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Physician Management
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Physician
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {physicians.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No physicians added yet</p>
              </div>
            ) : (
              physicians.map((physician) => (
                <div key={physician.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      Dr. {physician.first_name} {physician.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{physician.specialization || 'General'}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-medium">{physician.patient_count}</div>
                      <div className="text-xs text-gray-500">Patients</div>
                    </div>
                    <Badge variant={physician.is_active ? 'default' : 'secondary'}>
                      {physician.is_active ? 'On Duty' : 'Off Duty'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={physician.is_active ? "destructive" : "default"}
                      onClick={() => togglePhysicianStatus(physician.id, physician.is_active)}
                    >
                      {physician.is_active ? 'Set Off Duty' : 'Set On Duty'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
