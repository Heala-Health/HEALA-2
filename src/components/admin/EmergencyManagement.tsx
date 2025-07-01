
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Siren, MapPin, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRequest {
  id: string;
  patient_id: string;
  emergency_type: string;
  severity: string;
  status: string;
  description: string;
  location_latitude: number | null;
  location_longitude: number | null;
  created_at: string;
  assigned_physician_id: string | null;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  assigned_physician?: {
    first_name: string;
    last_name: string;
  };
}

export const EmergencyManagement: React.FC = () => {
  const { toast } = useToast();
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchEmergencyRequests();
    
    // Set up real-time subscription for emergency requests
    const channel = supabase
      .channel('emergency-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests'
        },
        () => {
          fetchEmergencyRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select(`
          *,
          patient:profiles!emergency_requests_patient_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          assigned_physician:profiles!emergency_requests_assigned_physician_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map((request: any) => ({
        ...request,
        patient: request.patient || {
          first_name: 'Unknown',
          last_name: 'Patient',
          email: 'unknown@example.com',
          phone: 'N/A'
        },
        assigned_physician: request.assigned_physician
      })) || [];
      
      setEmergencyRequests(transformedData);
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

  const updateEmergencyStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setEmergencyRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));

      toast({
        title: "Status Updated",
        description: `Emergency request status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating emergency status:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency status.",
        variant: "destructive"
      });
    }
  };

  const broadcastEmergencyAlert = async () => {
    if (!broadcastMessage.trim()) return;

    setBroadcasting(true);
    try {
      // Insert notification for all users
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin');

      if (users) {
        const notifications = users.map(user => ({
          user_id: user.id,
          title: 'Emergency Alert',
          message: broadcastMessage,
          type: 'emergency'
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;
      }

      setBroadcastMessage('');
      toast({
        title: "Alert Broadcasted",
        description: "Emergency alert has been sent to all users.",
      });
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      toast({
        title: "Error",
        description: "Failed to broadcast emergency alert.",
        variant: "destructive"
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading emergency management...</div>;
  }

  const criticalRequests = emergencyRequests.filter(req => 
    req.severity === 'critical' && req.status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalRequests.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalRequests.length} CRITICAL emergency request(s) require immediate attention!</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Emergency Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-red-500" />
            Emergency Alert Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter emergency alert message to broadcast to all users..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={broadcastEmergencyAlert} 
            disabled={!broadcastMessage.trim() || broadcasting}
            className="bg-red-600 hover:bg-red-700"
          >
            <Siren className="w-4 h-4 mr-2" />
            {broadcasting ? 'Broadcasting...' : 'Broadcast Emergency Alert'}
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Requests ({emergencyRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyRequests.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No emergency requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencyRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(request.severity)}>
                        {request.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {request.emergency_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="font-semibold">
                        {request.patient.first_name} {request.patient.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{request.patient.email}</p>
                      {request.patient.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {request.patient.phone}
                        </div>
                      )}
                    </div>
                    {(request.location_latitude && request.location_longitude) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        Location: {request.location_latitude}, {request.location_longitude}
                      </div>
                    )}
                  </div>

                  {request.description && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-3">
                      {request.description}
                    </p>
                  )}

                  {request.assigned_physician && (
                    <p className="text-sm text-gray-600 mb-3">
                      Assigned to: Dr. {request.assigned_physician.first_name} {request.assigned_physician.last_name}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateEmergencyStatus(request.id, 'in_progress')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateEmergencyStatus(request.id, 'assigned')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Assign Physician
                        </Button>
                      </>
                    )}
                    {request.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => updateEmergencyStatus(request.id, 'resolved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Resolved
                      </Button>
                    )}
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
