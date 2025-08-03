
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, MapPin, Clock, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TransportBookingProps {
  patientId?: string;
  patientName?: string;
}

export const FixedTransportBooking: React.FC<TransportBookingProps> = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    transport_type: '',
    pickup_address: '',
    destination_address: '',
    scheduled_time: ''
  });

  const transportTypes = [
    'Standard Car',
    'Luxury Vehicle', 
    'Ambulance',
    'Wheelchair Accessible Vehicle',
    'Bus/Shuttle'
  ];

  const validateForm = (): string | null => {
    if (!patientId) {
      return "Please search for a patient first to book transport";
    }
    
    if (!formData.transport_type) {
      return "Please select a transport type";
    }
    
    if (!formData.pickup_address.trim()) {
      return "Please enter a pickup address";
    }
    
    if (!formData.destination_address.trim()) {
      return "Please enter a destination address";
    }
    
    if (!formData.scheduled_time) {
      return "Please select a scheduled time";
    }
    
    // Check if scheduled time is in the future
    const scheduledDate = new Date(formData.scheduled_time);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return "Scheduled time must be in the future";
    }
    
    return null;
  };

  const bookTransport = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      console.log('Creating transport request with data:', {
        patient_id: patientId,
        agent_id: user?.id,
        ...formData
      });

      const { data, error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: patientId,
          agent_id: user?.id,
          transport_type: formData.transport_type,
          pickup_address: formData.pickup_address,
          destination_address: formData.destination_address,
          scheduled_time: formData.scheduled_time,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Transport booking error:', error);
        throw error;
      }

      console.log('Transport request created:', data);
      
      setSuccess(true);
      toast({
        title: "Transport Booked Successfully!",
        description: `Transport request for ${patientName || 'patient'} has been submitted.`,
      });

      // Reset form after successful booking
      setFormData({
        transport_type: '',
        pickup_address: '',
        destination_address: '',
        scheduled_time: ''
      });

      // Clear success state after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error booking transport:', error);
      
      let errorMessage = "Failed to book transport. Please try again.";
      
      if (error.message?.includes('row-level security')) {
        errorMessage = "You don't have permission to book transport. Please ensure you're logged in as an agent.";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "Invalid patient or agent reference. Please refresh and try again.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date time (current time + 30 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Book Transport
          {success && <CheckCircle className="w-5 h-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!patientId && (
          <Alert>
            <AlertDescription>
              Please search for a patient first to book transport services.
            </AlertDescription>
          </Alert>
        )}

        {patientId && patientName && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Booking transport for:</strong> {patientName}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="transport-type">Transport Type *</Label>
          <Select 
            value={formData.transport_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, transport_type: value }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transport type" />
            </SelectTrigger>
            <SelectContent>
              {transportTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pickup">Pickup Address *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="pickup"
              placeholder="Enter pickup address"
              value={formData.pickup_address}
              onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="destination">Destination Address *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="destination"
              placeholder="Enter destination address"
              value={formData.destination_address}
              onChange={(e) => setFormData(prev => ({ ...prev, destination_address: e.target.value }))}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="time">Scheduled Time *</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="time"
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="pl-10"
              min={getMinDateTime()}
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Minimum booking time: 30 minutes from now
          </p>
        </div>

        <Button 
          onClick={bookTransport} 
          disabled={loading || !patientId || success} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking Transport...
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Transport Booked Successfully!
            </>
          ) : (
            <>
              <Car className="w-4 h-4 mr-2" />
              Book Transport
            </>
          )}
        </Button>

        {!patientId && (
          <p className="text-sm text-gray-500 text-center">
            Search for a patient above to enable transport booking
          </p>
        )}
      </CardContent>
    </Card>
  );
};
