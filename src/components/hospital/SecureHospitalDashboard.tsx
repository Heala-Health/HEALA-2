
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, UserPlus, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  license_number: string;
  is_active: boolean;
  created_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  last_appointment: string;
  total_appointments: number;
}

interface SecuritySettings {
  two_factor_required?: boolean;
  ip_whitelist?: string[];
  session_timeout?: number;
}

export const SecureHospitalDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState({
    two_factor_enabled: false,
    ip_whitelist_active: false,
    session_timeout: 3600
  });

  useEffect(() => {
    if (user && profile?.role === 'hospital_admin') {
      fetchHospitalData();
      checkSecurityStatus();
    }
  }, [user, profile]);

  const fetchHospitalData = async () => {
    try {
      // Fetch physicians associated with this hospital
      const { data: physiciansData, error: physiciansError } = await supabase
        .from('profiles')
        .select('*')
        .eq('hospital_id', profile?.hospital_id)
        .eq('role', 'physician')
        .order('created_at', { ascending: false });

      if (physiciansError) throw physiciansError;
      setPhysicians(physiciansData || []);

      // Fetch patients who had appointments with hospital physicians
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          created_at,
          profiles!appointments_patient_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('hospital_id', profile?.hospital_id)
        .order('created_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Group patients and count appointments
      const patientMap = new Map();
      appointmentsData?.forEach((appointment: any) => {
        const patientId = appointment.patient_id;
        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            id: patientId,
            first_name: appointment.profiles?.first_name || '',
            last_name: appointment.profiles?.last_name || '',
            email: appointment.profiles?.email || '',
            last_appointment: appointment.created_at,
            total_appointments: 1
          });
        } else {
          const existing = patientMap.get(patientId);
          existing.total_appointments += 1;
          if (appointment.created_at > existing.last_appointment) {
            existing.last_appointment = appointment.created_at;
          }
        }
      });

      setPatients(Array.from(patientMap.values()));
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      toast({
        title: "Error",
        description: "Failed to load hospital data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSecurityStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('security_settings')
        .eq('id', profile?.hospital_id)
        .single();

      if (error) throw error;

      if (data?.security_settings) {
        const settings = data.security_settings as SecuritySettings;
        setSecurityStatus({
          two_factor_enabled: settings.two_factor_required || false,
          ip_whitelist_active: (settings.ip_whitelist || []).length > 0,
          session_timeout: settings.session_timeout || 3600
        });
      }
    } catch (error) {
      console.error('Error checking security status:', error);
    }
  };

  const togglePhysicianStatus = async (physicianId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', physicianId);

      if (error) throw error;

      setPhysicians(prev => prev.map(physician => 
        physician.id === physicianId 
          ? { ...physician, is_active: !currentStatus }
          : physician
      ));

      toast({
        title: "Status Updated",
        description: `Physician has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error updating physician status:', error);
      toast({
        title: "Error",
        description: "Failed to update physician status.",
        variant: "destructive"
      });
    }
  };

  if (profile?.role !== 'hospital_admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the hospital dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="p-6">Loading hospital dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {securityStatus.two_factor_enabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Two-Factor Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              {securityStatus.ip_whitelist_active ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span>IP Whitelist</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Session Timeout: {securityStatus.session_timeout / 60}min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="physicians" className="space-y-4">
        <TabsList>
          <TabsTrigger value="physicians">Physicians ({physicians.length})</TabsTrigger>
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="physicians">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Hospital Physicians
                </span>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Add New Physician
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {physicians.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No physicians registered yet</p>
              ) : (
                <div className="space-y-4">
                  {physicians.map((physician) => (
                    <div key={physician.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">
                            Dr. {physician.first_name} {physician.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{physician.specialization}</p>
                          <p className="text-xs text-gray-500">{physician.email}</p>
                          <p className="text-xs text-gray-500">License: {physician.license_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={physician.is_active ? "default" : "secondary"}>
                          {physician.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePhysicianStatus(physician.id, physician.is_active)}
                        >
                          {physician.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Hospital Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No patients found</p>
              ) : (
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        <p className="text-xs text-gray-500">
                          Last appointment: {new Date(patient.last_appointment).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {patient.total_appointments} appointment{patient.total_appointments !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Physicians</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{physicians.length}</div>
                <p className="text-xs text-gray-500">
                  {physicians.filter(p => p.is_active).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <p className="text-xs text-gray-500">Unique patients served</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patients.reduce((sum, patient) => sum + patient.total_appointments, 0)}
                </div>
                <p className="text-xs text-gray-500">All time</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
