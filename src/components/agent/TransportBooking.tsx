
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TransportBookingProps {
  patientId?: string;
  patientName?: string;
}

export const TransportBooking: React.FC<TransportBookingProps> = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transportType, setTransportType] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const transportTypes = ['Car', 'Ambulance', 'Wheelchair Accessible Vehicle', 'Bus'];

  const bookTransport = async () => {
    if (!patientId || !transportType || !pickupAddress || !destinationAddress || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: patientId,
          agent_id: user?.id,
          transport_type: transportType,
          pickup_address: pickupAddress,
          destination_address: destinationAddress,
          scheduled_time: scheduledTime,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: "Transport request has been submitted successfully.",
      });

      // Reset form
      setTransportType('');
      setPickupAddress('');
      setDestinationAddress('');
      setScheduledTime('');

    } catch (error) {
      console.error('Error booking transport:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book transport. Please try again.",
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
          <Label htmlFor="transport-type">Transport Type</Label>
          <Select value={transportType} onValueChange={setTransportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select transport type" />
            </SelectTrigger>
            <SelectContent>
              {transportTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pickup">Pickup Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="pickup"
              placeholder="Enter pickup address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="destination">Destination Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="destination"
              placeholder="Enter destination address"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="time">Scheduled Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="time"
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="pl-10"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>

        <Button onClick={bookTransport} disabled={loading || !patientId} className="w-full">
          {loading ? 'Booking...' : 'Book Transport'}
        </Button>

        {!patientId && (
          <p className="text-sm text-gray-500 text-center">
            Please search for a patient first to book transport
          </p>
        )}
      </CardContent>
    </Card>
  );
};
