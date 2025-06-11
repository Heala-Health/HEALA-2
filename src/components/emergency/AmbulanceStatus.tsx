
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AmbulanceRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  emergency_type: string;
  description: string;
  contact_phone: string;
  status: string;
  ambulance_eta: number;
  created_at: string;
}

export const AmbulanceStatus: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('ambulance_requests')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching ambulance requests:', error);
      toast({
        title: "Error",
        description: "Failed to load ambulance requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'en_route': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading ambulance requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Ambulance Requests</h3>
            <p className="text-gray-600">You haven't made any ambulance requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {request.emergency_type}
                </CardTitle>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Pickup: {request.pickup_address}</p>
                    {request.destination_address && (
                      <p className="text-sm text-gray-600">Destination: {request.destination_address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{request.contact_phone}</span>
                </div>

                {request.ambulance_eta && request.status === 'en_route' && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-green-600">
                      ETA: {request.ambulance_eta} minutes
                    </span>
                  </div>
                )}

                {request.description && (
                  <p className="text-sm text-gray-600">{request.description}</p>
                )}

                <p className="text-xs text-gray-500">
                  Requested: {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
