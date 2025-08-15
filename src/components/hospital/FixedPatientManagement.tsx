
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HospitalPatient {
  id: string;
  patient_id: string;
  admission_date: string;
  status: string;
  room_number: string | null;
  patient_profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
}

export const FixedPatientManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHospitalPatients = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data: patientsData, error } = await supabase
        .from('hospital_patients')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('admission_date', { ascending: false });

      if (error) throw error;

      // Fetch patient profiles separately
      if (patientsData && patientsData.length > 0) {
        const patientIds = patientsData.map(p => p.patient_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', patientIds);

        if (profilesError) throw profilesError;

        const patientsWithProfiles = patientsData.map(patient => ({
          ...patient,
          patient_profile: profilesData?.find(p => p.id === patient.patient_id) || null
        }));

        setPatients(patientsWithProfiles);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching hospital patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchHospitalPatients();
    }
  }, [profile?.hospital_id]);

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    const profile = patient.patient_profile;
    if (!profile) return false;
    
    return (
      profile.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="p-6">Loading patients...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Hospital Patients ({filteredPatients.length})
          </CardTitle>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No patients found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {patient.patient_profile?.first_name} {patient.patient_profile?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{patient.patient_profile?.email}</p>
                    <p className="text-sm text-gray-600">{patient.patient_profile?.phone}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                      {patient.room_number && (
                        <Badge variant="outline">Room {patient.room_number}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Admitted: {new Date(patient.admission_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
