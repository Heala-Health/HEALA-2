
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AssistedPatient } from './types';
import { PatientCard } from './PatientCard';

export const AssistedPatients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<AssistedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAssistance, setNewAssistance] = useState({
    patient_email: '',
    assistance_type: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchAssistedPatients();
    }
  }, [user]);

  const fetchAssistedPatients = async () => {
    try {
      const { data: assistedData, error: assistedError } = await supabase
        .from('agent_assisted_patients')
        .select('*')
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (assistedError) throw assistedError;

      const formattedData = await Promise.all((assistedData || []).map(async (item) => {
        const { data: patientData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', item.patient_id)
          .single();

        return {
          ...item,
          patient_name: patientData ? `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() : 'Unknown',
          patient_email: patientData?.email || 'Unknown'
        };
      }));

      setPatients(formattedData);
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

  const handleAddPatient = async () => {
    if (!user) return;

    try {
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAssistance.patient_email)
        .eq('role', 'patient')
        .single();

      if (patientError || !patientData) {
        toast({
          title: "Patient Not Found",
          description: "No patient found with this email address.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agent_assisted_patients')
        .insert({
          agent_id: user.id,
          patient_id: patientData.id,
          assistance_type: newAssistance.assistance_type,
          description: newAssistance.description
        });

      if (error) throw error;

      toast({
        title: "Patient Added",
        description: "Patient has been added to your assistance list.",
      });

      setIsDialogOpen(false);
      setNewAssistance({
        patient_email: '',
        assistance_type: '',
        description: ''
      });
      fetchAssistedPatients();

    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient.",
        variant: "destructive"
      });
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.assistance_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-6 h-6" />
              <span>Assisted Patients</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Patient to Assistance List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_email">Patient Email</Label>
                    <Input
                      id="patient_email"
                      placeholder="patient@example.com"
                      value={newAssistance.patient_email}
                      onChange={(e) => setNewAssistance(prev => ({ ...prev, patient_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assistance_type">Assistance Type</Label>
                    <Select value={newAssistance.assistance_type} onValueChange={(value) => setNewAssistance(prev => ({ ...prev, assistance_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assistance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment Booking</SelectItem>
                        <SelectItem value="transport">Transportation</SelectItem>
                        <SelectItem value="emergency">Emergency Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the assistance needed"
                      value={newAssistance.description}
                      onChange={(e) => setNewAssistance(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddPatient} className="w-full">
                    Add Patient
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assisted Patients</h3>
                <p className="text-gray-600">Start by adding patients who need assistance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
