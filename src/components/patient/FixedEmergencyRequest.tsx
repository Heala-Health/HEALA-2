
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const FixedEmergencyRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [emergencyData, setEmergencyData] = useState({
    emergency_type: '',
    description: '',
    severity: 'medium',
    pickup_address: '',
    contact_phone: ''
  });

  const submitEmergencyRequest = async () => {
    if (!emergencyData.emergency_type || !emergencyData.pickup_address || !emergencyData.contact_phone) {
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
        .from('emergency_requests')
        .insert({
          patient_id: user?.id,
          emergency_type: emergencyData.emergency_type,
          description: emergencyData.description,
          severity: emergencyData.severity,
          pickup_address: emergencyData.pickup_address,
          contact_phone: emergencyData.contact_phone,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Emergency Request Submitted",
        description: "Your emergency request has been submitted. Help is on the way!",
      });

      setEmergencyData({
        emergency_type: '',
        description: '',
        severity: 'medium',
        pickup_address: '',
        contact_phone: ''
      });
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast({
        title: "Error",
        description: "Failed to submit emergency request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Emergency Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Emergency Type *</label>
          <Select value={emergencyData.emergency_type} onValueChange={(value) => setEmergencyData(prev => ({ ...prev, emergency_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select emergency type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medical">Medical Emergency</SelectItem>
              <SelectItem value="accident">Accident</SelectItem>
              <SelectItem value="cardiac">Cardiac Emergency</SelectItem>
              <SelectItem value="respiratory">Breathing Difficulty</SelectItem>
              <SelectItem value="trauma">Trauma/Injury</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Severity Level</label>
          <Select value={emergencyData.severity} onValueChange={(value) => setEmergencyData(prev => ({ ...prev, severity: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Pickup Address *</label>
          <Input
            value={emergencyData.pickup_address}
            onChange={(e) => setEmergencyData(prev => ({ ...prev, pickup_address: e.target.value }))}
            placeholder="Enter your current location/address"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Contact Phone *</label>
          <Input
            value={emergencyData.contact_phone}
            onChange={(e) => setEmergencyData(prev => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="Enter phone number for emergency contact"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={emergencyData.description}
            onChange={(e) => setEmergencyData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the emergency situation..."
            rows={3}
          />
        </div>

        <Button onClick={submitEmergencyRequest} disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {loading ? 'Submitting...' : 'Submit Emergency Request'}
        </Button>
      </CardContent>
    </Card>
  );
};
