
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Calendar, Car, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AssistedPatientDetail {
  id: string;
  patient_id: string;
  assistance_type: string;
  description: string;
  status: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

export const PatientAssistance: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<AssistedPatientDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPatientDialog, setAddPatientDialog] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patientEmail: '',
    assistanceType: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchAssistedPatients();
    }
  }, [user]);

  const fetchAssistedPatients = async () => {
    if (!user) return;

    try {
      const { data: assistedData, error: assistedError } = await supabase
        .from('agent_assisted_patients')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (assistedError) throw assistedError;

      const patientsWithDetails = await Promise.all((assistedData || []).map(async (item) => {
        const { data: patientData } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, email')
          .eq('id', item.patient_id)
          .single();

        return {
          ...item,
          patient: patientData || {
            first_name: 'Unknown',
            last_name: '',
            phone: '',
            email: 'Unknown'
          }
        };
      }));

      setPatients(patientsWithDetails);
    } catch (error) {
      console.error('Error fetching assisted patients:', error);
      toast({
        title: "Error",
        description: "Failed to load assisted patients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addAssistedPatient = async () => {
    if (!user || !newPatient.patientEmail || !newPatient.assistanceType) return;

    try {
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newPatient.patientEmail)
        .eq('role', 'patient')
        .single();

      if (patientError || !patientData) {
        toast({
          title: "Patient Not Found",
          description: "No patient found with that email address.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agent_assisted_patients')
        .insert({
          agent_id: user.id,
          patient_id: patientData.id,
          assistance_type: newPatient.assistanceType,
          description: newPatient.description
        });

      if (error) throw error;

      toast({
        title: "Patient Added",
        description: "Patient has been added to your assistance list.",
      });

      setNewPatient({ patientEmail: '', assistanceType: '', description: '' });
      setAddPatientDialog(false);
      fetchAssistedPatients();

    } catch (error) {
      console.error('Error adding assisted patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading assisted patients...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assisted Patients ({patients.length})
            </CardTitle>
            <Dialog open={addPatientDialog} onOpenChange={setAddPatientDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Patient to Assistance Program</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patientEmail">Patient Email</Label>
                    <Input
                      id="patientEmail"
                      placeholder="patient@example.com"
                      value={newPatient.patientEmail}
                      onChange={(e) => setNewPatient({ ...newPatient, patientEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assistanceType">Assistance Type</Label>
                    <Input
                      id="assistanceType"
                      placeholder="e.g., Appointment booking, Transportation"
                      value={newPatient.assistanceType}
                      onChange={(e) => setNewPatient({ ...newPatient, assistanceType: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Additional details about assistance needed"
                      value={newPatient.description}
                      onChange={(e) => setNewPatient({ ...newPatient, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={addAssistedPatient} className="w-full">
                    Add Patient
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No assisted patients yet</p>
              <p className="text-sm">Add patients to start providing assistance</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {patient.patient.first_name} {patient.patient.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{patient.patient.email}</p>
                      {patient.patient.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.patient.phone}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Assistance Type: </span>
                      <span className="text-gray-600">{patient.assistance_type}</span>
                    </div>
                    {patient.description && (
                      <div>
                        <span className="font-medium">Description: </span>
                        <span className="text-gray-600">{patient.description}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Started: </span>
                      <span className="text-gray-600">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Appointment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Car className="w-4 h-4 mr-2" />
                      Arrange Transport
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
