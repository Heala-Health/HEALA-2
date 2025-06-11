
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  hospital_id?: string;
}

export const HospitalPhysicianAssignment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [hospitalPhysicians, setHospitalPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [hospitalId, setHospitalId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchHospitalId();
      fetchHospitalPhysicians();
    }
  }, [user]);

  const fetchHospitalId = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setHospitalId(data.hospital_id);
    } catch (error) {
      console.error('Error fetching hospital ID:', error);
    }
  };

  const fetchHospitalPhysicians = async () => {
    if (!hospitalId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, specialization, hospital_id')
        .eq('role', 'physician')
        .eq('hospital_id', hospitalId);

      if (error) throw error;

      setHospitalPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching hospital physicians:', error);
    }
  };

  const searchPhysicians = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a name or email to search for physicians.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, specialization, hospital_id')
        .eq('role', 'physician')
        .is('hospital_id', null) // Only unassigned physicians
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      if (error) throw error;

      if (data && data.length > 0) {
        setPhysicians(data);
        toast({
          title: "Physicians Found",
          description: `Found ${data.length} unassigned physician(s).`,
        });
      } else {
        setPhysicians([]);
        toast({
          title: "No Physicians Found",
          description: "No unassigned physicians found matching your search.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching physicians:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for physicians.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignPhysician = async (physicianId: string, physicianName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hospital_id: hospitalId })
        .eq('id', physicianId);

      if (error) throw error;

      toast({
        title: "Physician Assigned",
        description: `Dr. ${physicianName} has been assigned to your hospital.`,
      });

      // Refresh lists
      fetchHospitalPhysicians();
      setPhysicians(prev => prev.filter(p => p.id !== physicianId));
    } catch (error) {
      console.error('Error assigning physician:', error);
      toast({
        title: "Error",
        description: "Failed to assign physician to hospital.",
        variant: "destructive"
      });
    }
  };

  const removePhysician = async (physicianId: string, physicianName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hospital_id: null })
        .eq('id', physicianId);

      if (error) throw error;

      toast({
        title: "Physician Removed",
        description: `Dr. ${physicianName} has been removed from your hospital.`,
      });

      fetchHospitalPhysicians();
    } catch (error) {
      console.error('Error removing physician:', error);
      toast({
        title: "Error",
        description: "Failed to remove physician from hospital.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Physicians to Hospital</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search for physicians by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchPhysicians} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {physicians.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Available Physicians</h4>
              {physicians.map((physician) => (
                <div
                  key={physician.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-gray-400" />
                    <div>
                      <h4 className="font-medium">
                        Dr. {physician.first_name} {physician.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{physician.email}</p>
                      <Badge variant="outline">{physician.specialization || 'General'}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignPhysician(
                      physician.id, 
                      `${physician.first_name} ${physician.last_name}`
                    )}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hospital Physicians ({hospitalPhysicians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {hospitalPhysicians.length === 0 ? (
            <p className="text-gray-600">No physicians assigned to this hospital yet.</p>
          ) : (
            <div className="space-y-3">
              {hospitalPhysicians.map((physician) => (
                <div
                  key={physician.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-blue-400" />
                    <div>
                      <h4 className="font-medium">
                        Dr. {physician.first_name} {physician.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{physician.email}</p>
                      <Badge variant="outline">{physician.specialization || 'General'}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePhysician(
                      physician.id, 
                      `${physician.first_name} ${physician.last_name}`
                    )}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
