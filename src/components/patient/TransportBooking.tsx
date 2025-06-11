
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Car, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const TransportBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    scheduledDate: '',
    scheduledTime: '',
    transportType: 'standard',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Insert into transport_requests table (which exists in Supabase)
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: user.id,
          pickup_address: formData.pickupAddress,
          destination_address: formData.destinationAddress,
          scheduled_time: scheduledDateTime.toISOString(),
          transport_type: formData.transportType,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: "Your transport has been successfully booked.",
      });

      // Reset form
      setFormData({
        pickupAddress: '',
        destinationAddress: '',
        scheduledDate: '',
        scheduledTime: '',
        transportType: 'standard',
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
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pickupAddress">Pickup Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="Enter pickup location"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="destinationAddress">Destination Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="destinationAddress"
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                placeholder="Enter destination"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="transportType">Transport Type</Label>
            <Select value={formData.transportType} onValueChange={(value) => setFormData({ ...formData, transportType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="wheelchair">Wheelchair Accessible</SelectItem>
                <SelectItem value="medical">Medical Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or notes"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Booking...' : 'Book Transport'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
