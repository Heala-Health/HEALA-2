
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MapPin, User, Phone, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRequest {
  id: string;
  patient_id: string;
  emergency_type: string;
  description: string;
  severity: string;
  status: string;
  location_latitude: number | null;
  location_longitude: number | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export const HospitalEmergencyManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchEmergencyRequests();
      
      // Set up real-time subscription for emergency updates
      const channel = supabase
        .channel('emergency-updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'emergency_requests',
          filter: `hospital_id=eq.${profile.hospital_id}`
        }, () => {
          fetchEmergencyRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.hospital_id]);

  const fetchEmergencyRequests = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch patient details for each emergency
      const emergenciesWithPatients = await Promise.all(
        (data || []).map(async (emergency) => {
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone')
            .eq('id', emergency.patient_id)
            .single();

          return {
            ...emergency,
            patient: patientData
          };
        })
      );

      setEmergencies(emergenciesWithPatients);
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

  const updateEmergencyStatus = async (emergencyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .update({ status: newStatus })
        .eq('id', emergencyId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Emergency status updated to ${newStatus}.`,
      });

      fetchEmergencyRequests();
    } catch (error) {
      console.error('Error updating emergency status:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency status.",
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
      case 'pending': return 'bg-red-100 text-red-800';
      case 'responded': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading emergency requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Emergency Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {emergencies.filter(e => e.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {emergencies.filter(e => e.status === 'responded').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {emergencies.filter(e => e.status === 'resolved').length}
              </div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {emergencies.filter(e => e.severity === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Requests
            <Badge variant="outline" className="ml-auto">
              <Zap className="w-3 h-3 mr-1" />
              Live Updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencies.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emergency requests at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencies.map((emergency) => (
                <div key={emergency.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        emergency.severity === 'critical' ? 'text-red-600' :
                        emergency.severity === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <div>
                        <h4 className="font-medium">{emergency.emergency_type}</h4>
                        <p className="text-sm text-gray-600">{emergency.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(emergency.severity)}>
                        {emergency.severity}
                      </Badge>
                      <Badge className={getStatusColor(emergency.status)}>
                        {emergency.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {emergency.patient ? 
                          `${emergency.patient.first_name} ${emergency.patient.last_name}` :
                          'Patient info unavailable'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {emergency.patient?.phone || 'No phone number'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(emergency.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {emergency.location_latitude && emergency.location_longitude && (
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        Location: {emergency.location_latitude.toFixed(6)}, {emergency.location_longitude.toFixed(6)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {emergency.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateEmergencyStatus(emergency.id, 'responded')}
                      >
                        Respond
                      </Button>
                    )}
                    {emergency.status === 'responded' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateEmergencyStatus(emergency.id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
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
