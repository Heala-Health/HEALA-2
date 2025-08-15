
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const FixedTransportBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [transportData, setTransportData] = useState({
    transport_type: '',
    pickup_address: '',
    destination_address: '',
    scheduled_time: '',
    notes: ''
  });

  const bookTransport = async () => {
    if (!transportData.transport_type || !transportData.pickup_address || !transportData.destination_address || !transportData.scheduled_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: user?.id,
          transport_type: transportData.transport_type,
          pickup_address: transportData.pickup_address,
          destination_address: transportData.destination_address,
          scheduled_time: transportData.scheduled_time,
          notes: transportData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: "Your transport has been booked successfully!",
      });

      setTransportData({
        transport_type: '',
        pickup_address: '',
        destination_address: '',
        scheduled_time: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error booking transport:', error);
      toast({
        title: "Error",
        description: "Failed to book transport.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Book Transport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Transport Type *</label>
          <Select value={transportData.transport_type} onValueChange={(value) => setTransportData(prev => ({ ...prev, transport_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select transport type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ambulance">Ambulance</SelectItem>
              <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
              <SelectItem value="standard">Standard Vehicle</SelectItem>
              <SelectItem value="stretcher">Stretcher Transport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Pickup Address *</label>
          <Input
            value={transportData.pickup_address}
            onChange={(e) => setTransportData(prev => ({ ...prev, pickup_address: e.target.value }))}
            placeholder="Enter pickup location"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Destination Address *</label>
          <Input
            value={transportData.destination_address}
            onChange={(e) => setTransportData(prev => ({ ...prev, destination_address: e.target.value }))}
            placeholder="Enter destination"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Scheduled Time *</label>
          <Input
            type="datetime-local"
            value={transportData.scheduled_time}
            onChange={(e) => setTransportData(prev => ({ ...prev, scheduled_time: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Additional Notes</label>
          <Textarea
            value={transportData.notes}
            onChange={(e) => setTransportData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any special requirements or notes..."
            rows={3}
          />
        </div>

        <Button onClick={bookTransport} disabled={loading} className="w-full">
          <Car className="w-4 h-4 mr-2" />
          {loading ? 'Booking...' : 'Book Transport'}
        </Button>
      </CardContent>
    </Card>
  );
};
