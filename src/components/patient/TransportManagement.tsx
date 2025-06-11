
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, X, Clock, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TransportBooking } from './TransportBooking';

interface TransportRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  scheduled_time: string;
  status: string;
  transport_type: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  agent_id?: string;
}

export const TransportManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchTransportData();
    }
  }, [user]);

  const fetchTransportData = async () => {
    if (!user) return;

    try {
      // Fetch transport requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelTransport = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason || 'No reason provided'
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transport request cancelled successfully.",
      });

      setCancellingId(null);
      setCancellationReason('');
      fetchTransportData();
    } catch (error) {
      console.error('Error cancelling transport:', error);
      toast({
        title: "Error",
        description: "Failed to cancel transport request.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const renderTransportList = (transports: TransportRequest[]) => {
    const activeTransports = transports.filter(t => !['cancelled', 'completed'].includes(t.status));

    if (activeTransports.length === 0) {
      return (
        <div className="text-center py-8">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No active transport requests</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activeTransports.map((transport) => (
          <div key={transport.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{transport.transport_type}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    From: {transport.pickup_address}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    To: {transport.destination_address}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(transport.scheduled_time).toLocaleString()}
                  </div>
                  {transport.agent_id && (
                    <div className="text-blue-600 text-xs">
                      Booked by agent
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(transport.status)}>
                  {transport.status}
                </Badge>
                {transport.status === 'pending' && (
                  <>
                    {cancellingId === transport.id ? (
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
                            onClick={() => cancelTransport(transport.id)}
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
                        onClick={() => setCancellingId(transport.id)}
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
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading transport requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Transport Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="book" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book">
              <Plus className="w-4 h-4 mr-2" />
              Book Transport
            </TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book" className="mt-6">
            <TransportBooking />
          </TabsContent>
          
          <TabsContent value="requests" className="mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold">My Transport Requests</h3>
              {renderTransportList(requests)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
