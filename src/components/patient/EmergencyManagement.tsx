
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Ambulance, X, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AmbulanceRequest {
  id: string;
  pickup_address: string;
  destination_address?: string;
  emergency_type: string;
  status: string;
  contact_phone: string;
  description?: string;
  ambulance_eta?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
}

export const EmergencyManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchAmbulanceRequests();
    }
  }, [user]);

  const fetchAmbulanceRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ambulance_requests')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch ambulance requests error:', error);
        throw error;
      }
      
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching ambulance requests:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAmbulance = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('ambulance_requests')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason || 'No reason provided'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Cancel ambulance error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Emergency request cancelled successfully.",
      });

      setCancellingId(null);
      setCancellationReason('');
      fetchAmbulanceRequests();
    } catch (error: any) {
      console.error('Error cancelling ambulance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel emergency request.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'dispatched': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const activeRequests = requests.filter(req => !['cancelled', 'completed'].includes(req.status));

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
          <Ambulance className="w-5 h-5" />
          Emergency Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeRequests.length === 0 ? (
          <div className="text-center py-8">
            <Ambulance className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active emergency requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-red-600 mb-2">
                      {request.emergency_type}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        From: {request.pickup_address}
                      </div>
                      {request.destination_address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          To: {request.destination_address}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                      {request.ambulance_eta && (
                        <div className="text-blue-600 font-medium">
                          ETA: {request.ambulance_eta} minutes
                        </div>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    {request.status === 'pending' && (
                      <>
                        {cancellingId === request.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Reason for cancellation"
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              className="w-64"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cancelAmbulance(request.id)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancellingId(null);
                                  setCancellationReason('');
                                }}
                              >
                                Keep
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCancellingId(request.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </>
                    )}
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
