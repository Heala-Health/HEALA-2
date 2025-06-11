
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRequest {
  id: string;
  emergency_type: string;
  severity: string;
  status: string;
  description: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  } | null;
  assigned_physician: {
    first_name: string;
    last_name: string;
  } | null;
}

export const EmergencyCoordination: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmergencyRequests();
    }
  }, [user]);

  const fetchEmergencyRequests = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hospital_id) return;

      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching emergency requests:', error);
        // Fallback to get all emergency requests without hospital filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('emergency_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        // Fetch patient and physician data separately
        const requestsWithDetails = await Promise.all(
          (fallbackData || []).map(async (request) => {
            let patient = null;
            let assigned_physician = null;

            if (request.patient_id) {
              const { data: patientData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', request.patient_id)
                .single();
              
              if (patientData) {
                patient = {
                  first_name: patientData.first_name || 'Unknown',
                  last_name: patientData.last_name || 'Patient'
                };
              }
            }

            if (request.assigned_physician_id) {
              const { data: physicianData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', request.assigned_physician_id)
                .single();
              
              if (physicianData) {
                assigned_physician = {
                  first_name: physicianData.first_name || 'Unknown',
                  last_name: physicianData.last_name || 'Physician'
                };
              }
            }

            return {
              id: request.id,
              emergency_type: request.emergency_type,
              severity: request.severity,
              status: request.status,
              description: request.description,
              created_at: request.created_at,
              patient,
              assigned_physician
            };
          })
        );
        
        setEmergencyRequests(requestsWithDetails);
        return;
      }
      
      // Fetch patient and physician data separately for successful query
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (request) => {
          let patient = null;
          let assigned_physician = null;

          if (request.patient_id) {
            const { data: patientData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', request.patient_id)
              .single();
            
            if (patientData) {
              patient = {
                first_name: patientData.first_name || 'Unknown',
                last_name: patientData.last_name || 'Patient'
              };
            }
          }

          if (request.assigned_physician_id) {
            const { data: physicianData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', request.assigned_physician_id)
              .single();
            
            if (physicianData) {
              assigned_physician = {
                first_name: physicianData.first_name || 'Unknown',
                last_name: physicianData.last_name || 'Physician'
              };
            }
          }

          return {
            id: request.id,
            emergency_type: request.emergency_type,
            severity: request.severity,
            status: request.status,
            description: request.description,
            created_at: request.created_at,
            patient,
            assigned_physician
          };
        })
      );
      
      setEmergencyRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignPhysician = async (requestId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hospital_id) return;

      const { data: physicians } = await supabase
        .from('profiles')
        .select('id')
        .eq('hospital_id', profile.hospital_id)
        .eq('role', 'physician')
        .eq('is_active', true)
        .limit(1);

      if (physicians && physicians.length > 0) {
        const { error } = await supabase
          .from('emergency_requests')
          .update({ 
            assigned_physician_id: physicians[0].id,
            status: 'assigned'
          })
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Physician assigned to emergency request.",
        });

        fetchEmergencyRequests();
      }
    } catch (error) {
      console.error('Error assigning physician:', error);
      toast({
        title: "Error",
        description: "Failed to assign physician.",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading emergency requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          Emergency Service Coordination
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emergencyRequests.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No emergency requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencyRequests.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{request.emergency_type}</h3>
                      <Badge className={getSeverityColor(request.severity)}>
                        {request.severity}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {request.patient && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Patient: {request.patient.first_name} {request.patient.last_name}
                        </div>
                      )}
                      
                      {request.assigned_physician && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Assigned: Dr. {request.assigned_physician.first_name} {request.assigned_physician.last_name}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                      
                      {request.description && (
                        <div className="mt-2">
                          <p className="text-sm">{request.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => assignPhysician(request.id)}
                      >
                        Assign Physician
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
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
