
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, User, Clock, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subscription_plan: string;
}

interface AssistanceRecord {
  id: string;
  patient_id: string;
  agent_id: string;
  assistance_type: string;
  status: string;
  created_at: string;
  patient: PatientInfo;
}

// Create a simple TransportForm component for this file
const TransportForm: React.FC<{ patientId: string; patientName: string }> = ({ patientId, patientName }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transport_type: 'ambulance',
    pickup_address: '',
    destination_address: '',
    scheduled_time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: patientId,
          transport_type: formData.transport_type,
          pickup_address: formData.pickup_address,
          destination_address: formData.destination_address,
          scheduled_time: formData.scheduled_time,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: `Transport has been booked for ${patientName}`,
      });

      setFormData({
        transport_type: 'ambulance',
        pickup_address: '',
        destination_address: '',
        scheduled_time: ''
      });
    } catch (error) {
      console.error('Error booking transport:', error);
      toast({
        title: "Error",
        description: "Failed to book transport",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Transport for {patientName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Transport Type</label>
            <select
              value={formData.transport_type}
              onChange={(e) => setFormData({...formData, transport_type: e.target.value})}
              className="w-full border rounded px-3 py-2"
            >
              <option value="ambulance">Ambulance</option>
              <option value="taxi">Taxi</option>
              <option value="private">Private Transport</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pickup Address</label>
            <Input
              value={formData.pickup_address}
              onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
              placeholder="Enter pickup address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destination</label>
            <Input
              value={formData.destination_address}
              onChange={(e) => setFormData({...formData, destination_address: e.target.value})}
              placeholder="Enter destination"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Time</label>
            <Input
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Booking...' : 'Book Transport'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const FixedPatientAssistance: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [assistanceRecords, setAssistanceRecords] = useState<AssistanceRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssistedPatients();
  }, []);

  const fetchAssistedPatients = async () => {
    try {
      // First get the assistance records
      const { data: assistanceData, error: assistanceError } = await supabase
        .from('agent_assisted_patients')
        .select('*')
        .eq('agent_id', user?.id);

      if (assistanceError) throw assistanceError;

      if (!assistanceData || assistanceData.length === 0) {
        setAssistanceRecords([]);
        return;
      }

      // Get unique patient IDs
      const patientIds = [...new Set(assistanceData.map(record => record.patient_id))];

      // Fetch patient profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, subscription_plan')
        .in('id', patientIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const records: AssistanceRecord[] = assistanceData.map(record => {
        const profile = profilesData?.find(p => p.id === record.patient_id);
        return {
          ...record,
          patient: {
            id: profile?.id || record.patient_id,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
            subscription_plan: profile?.subscription_plan || 'basic'
          }
        };
      });

      setAssistanceRecords(records);
    } catch (error) {
      console.error('Error fetching assisted patients:', error);
    }
  };

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, subscription_plan')
        .eq('role', 'patient')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (error) throw error;

      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assistPatient = async (patient: PatientInfo) => {
    try {
      const { error } = await supabase
        .from('agent_assisted_patients')
        .insert({
          agent_id: user?.id,
          patient_id: patient.id,
          assistance_type: 'general',
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Patient Added",
        description: `${patient.first_name} ${patient.last_name} has been added to your assistance list`,
      });

      fetchAssistedPatients();
    } catch (error) {
      console.error('Error assisting patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient to assistance list",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Patient Assistance</h2>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Patients</TabsTrigger>
          <TabsTrigger value="assisted">Assisted Patients</TabsTrigger>
          <TabsTrigger value="transport">Book Transport</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search for Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                />
                <Button onClick={searchPatients} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="space-y-2">
                {patients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      <Badge variant="outline">{patient.subscription_plan}</Badge>
                    </div>
                    <Button onClick={() => assistPatient(patient)} size="sm">
                      Assist Patient
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assisted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currently Assisted Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assistanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {record.patient.first_name} {record.patient.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{record.patient.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(record.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setSelectedPatient(record.patient)} 
                      size="sm"
                      variant="outline"
                    >
                      Book Transport
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          {selectedPatient ? (
            <TransportForm 
              patientId={selectedPatient.id} 
              patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Select a patient from the "Assisted Patients" tab to book transport</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
