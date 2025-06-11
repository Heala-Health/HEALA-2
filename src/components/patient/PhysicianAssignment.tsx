import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name?: string;
}

export const PhysicianAssignment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [assignedPhysician, setAssignedPhysician] = useState<Physician | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignedPhysician();
      fetchAvailablePhysicians();
    }
  }, [user]);

  const fetchAssignedPhysician = async () => {
    try {
      const { data: assignment, error } = await supabase
        .from('physician_patients')
        .select('physician_id')
        .eq('patient_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (assignment) {
        // Fetch physician details separately
        const { data: physicianData, error: physicianError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, specialization, hospital_id')
          .eq('id', assignment.physician_id)
          .single();

        if (physicianError) throw physicianError;

        // Fetch hospital name if physician has hospital_id
        let hospitalName = undefined;
        if (physicianData.hospital_id) {
          const { data: hospitalData, error: hospitalError } = await supabase
            .from('hospitals')
            .select('name')
            .eq('id', physicianData.hospital_id)
            .single();

          if (!hospitalError && hospitalData) {
            hospitalName = hospitalData.name;
          }
        }

        setAssignedPhysician({
          id: physicianData.id,
          first_name: physicianData.first_name || 'Unknown',
          last_name: physicianData.last_name || '',
          specialization: physicianData.specialization || 'General',
          hospital_name: hospitalName
        });
      }
    } catch (error) {
      console.error('Error fetching assigned physician:', error);
    }
  };

  const fetchAvailablePhysicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization, hospital_id')
        .eq('role', 'physician')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;

      // Fetch hospital names for each physician
      const physiciansWithHospitals = await Promise.all(
        (data || []).map(async (physician) => {
          let hospitalName = undefined;
          if (physician.hospital_id) {
            const { data: hospitalData } = await supabase
              .from('hospitals')
              .select('name')
              .eq('id', physician.hospital_id)
              .single();

            if (hospitalData) {
              hospitalName = hospitalData.name;
            }
          }

          return {
            id: physician.id,
            first_name: physician.first_name || 'Unknown',
            last_name: physician.last_name || '',
            specialization: physician.specialization || 'General',
            hospital_name: hospitalName
          };
        })
      );

      setPhysicians(physiciansWithHospitals);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAssignment = async (physicianId: string, physicianName: string) => {
    try {
      const { error } = await supabase
        .from('physician_patients')
        .insert({
          physician_id: physicianId,
          patient_id: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Assignment Requested",
        description: `You have been assigned to Dr. ${physicianName}`,
      });

      fetchAssignedPhysician();
    } catch (error) {
      console.error('Error requesting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to request physician assignment.",
        variant: "destructive"
      });
    }
  };

  const startConversation = async () => {
    if (!assignedPhysician || !user) return;

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('patient_id', user.id)
        .eq('physician_id', assignedPhysician.id)
        .eq('type', 'physician_consultation')
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            patient_id: user.id,
            physician_id: assignedPhysician.id,
            type: 'physician_consultation',
            title: `Consultation with ${user.user_metadata?.first_name || 'Patient'}`,
            status: 'active'
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConversation.id;
      }

      toast({
        title: "Chat Started",
        description: `You can now chat with Dr. ${assignedPhysician.first_name} ${assignedPhysician.last_name}`,
      });

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading physicians...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {assignedPhysician && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Your Assigned Physician</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <User className="w-12 h-12 text-green-600" />
                <div>
                  <h3 className="font-semibold">
                    Dr. {assignedPhysician.first_name} {assignedPhysician.last_name}
                  </h3>
                  <Badge variant="outline">{assignedPhysician.specialization}</Badge>
                </div>
              </div>
              <Button onClick={startConversation}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!assignedPhysician && (
        <Card>
          <CardHeader>
            <CardTitle>Available Physicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {physicians.map((physician) => (
                <div key={physician.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium">
                          Dr. {physician.first_name} {physician.last_name}
                        </h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{physician.specialization}</Badge>
                          {physician.hospital_name && (
                            <Badge variant="secondary">{physician.hospital_name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => requestAssignment(physician.id, `${physician.first_name} ${physician.last_name}`)}
                    >
                      Request Assignment
                    </Button>
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
