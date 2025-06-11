
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const AmbulanceRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup_address: '',
    destination_address: '',
    emergency_type: '',
    description: '',
    contact_phone: ''
  });

  const emergencyTypes = [
    'Medical Emergency',
    'Accident',
    'Cardiac Emergency',
    'Respiratory Emergency',
    'Trauma',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ambulance_requests')
        .insert({
          patient_id: user.id,
          pickup_address: formData.pickup_address,
          destination_address: formData.destination_address,
          emergency_type: formData.emergency_type,
          description: formData.description,
          contact_phone: formData.contact_phone,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Ambulance Requested",
        description: "Your ambulance request has been submitted. Emergency services will contact you shortly.",
      });

      // Reset form
      setFormData({
        pickup_address: '',
        destination_address: '',
        emergency_type: '',
        description: '',
        contact_phone: ''
      });

    } catch (error) {
      console.error('Error submitting ambulance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit ambulance request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          <span>Emergency Ambulance Request</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pickup_address">Pickup Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="pickup_address"
                placeholder="Enter pickup location"
                value={formData.pickup_address}
                onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_address">Destination Hospital (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="destination_address"
                placeholder="Preferred hospital (leave blank for nearest)"
                value={formData.destination_address}
                onChange={(e) => handleInputChange('destination_address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_type">Emergency Type *</Label>
            <Select value={formData.emergency_type} onValueChange={(value) => handleInputChange('emergency_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="contact_phone"
                placeholder="Your phone number"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Emergency Notice:</strong> If this is a life-threatening emergency, 
              please call 911 immediately. This form is for non-critical ambulance services.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700" 
            disabled={loading}
          >
            {loading ? 'Submitting Request...' : 'Request Ambulance'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
