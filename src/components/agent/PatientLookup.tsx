
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  role: string;
}

interface PatientLookupProps {
  onPatientFound: (patient: PatientInfo) => void;
}

export const PatientLookup: React.FC<PatientLookupProps> = ({ onPatientFound }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);

  const searchPatients = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a name or email to search for patients.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Search in profiles table with better query structure
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, city, state, role')
        .eq('role', 'patient')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      console.log('Search results:', data);

      if (data && data.length > 0) {
        const formattedPatients = data.map(patient => ({
          id: patient.id,
          first_name: patient.first_name || 'Unknown',
          last_name: patient.last_name || '',
          email: patient.email,
          phone: patient.phone,
          city: patient.city,
          state: patient.state,
          role: patient.role
        }));

        setPatients(formattedPatients);
        toast({
          title: "Patients Found",
          description: `Found ${formattedPatients.length} patient(s) matching your search.`,
        });
      } else {
        setPatients([]);
        toast({
          title: "No Patients Found",
          description: "No patients found matching your search criteria. Try a different search term.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search for patients. Please try again.",
        variant: "destructive"
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: PatientInfo) => {
    setSelectedPatient(patient);
    onPatientFound(patient);
    toast({
      title: "Patient Selected",
      description: `Selected ${patient.first_name} ${patient.last_name} for assistance.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPatients();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Patient Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={searchPatients} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Selected Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <User className="w-12 h-12 text-green-600" />
              <div>
                <h3 className="font-semibold">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {selectedPatient.email}
                </p>
                {selectedPatient.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedPatient.phone}
                  </p>
                )}
                {selectedPatient.city && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedPatient.city}, {selectedPatient.state}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {patients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({patients.length} found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedPatient?.id === patient.id ? 'border-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{patient.first_name} {patient.last_name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </p>
                        {patient.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Patient</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
