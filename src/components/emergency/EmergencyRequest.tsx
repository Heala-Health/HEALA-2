import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRequestProps {
  patientId?: string;
}

export const EmergencyRequest: React.FC<EmergencyRequestProps> = ({ patientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const emergencyTypes = [
    'Medical Emergency',
    'Accident',
    'Cardiac Event',
    'Stroke',
    'Difficulty Breathing',
    'Severe Allergic Reaction',
    'Mental Health Crisis',
    'Other'
  ];

  const severityLevels = ['Low', 'Medium', 'High', 'Critical'];

  const submitEmergencyRequest = async () => {
    const effectivePatientId = patientId || user?.id;
    
    if (!effectivePatientId) {
      toast({
        title: "Authentication Error",
        description: "Please log in to submit emergency request.",
        variant: "destructive"
      });
      return;
    }

    if (!emergencyType || !severity || !description || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First create emergency request
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .insert({
          patient_id: effectivePatientId,
          emergency_type: emergencyType,
          severity: severity.toLowerCase(),
          description: description,
          status: 'pending'
        })
        .select()
        .single();

      if (emergencyError) {
        console.error('Emergency request error:', emergencyError);
        throw emergencyError;
      }

      // Then create ambulance request
      const { error: ambulanceError } = await supabase
        .from('ambulance_requests')
        .insert({
          patient_id: effectivePatientId,
          emergency_type: emergencyType,
          pickup_address: location,
          status: 'pending',
          contact_phone: user?.phone || user?.user_metadata?.phone || '',
          description: description
        });

      if (ambulanceError) {
        console.error('Ambulance request error:', ambulanceError);
        throw ambulanceError;
      }

      toast({
        title: "Emergency Request Submitted",
        description: "Your emergency request has been submitted. Help is on the way!",
      });

      // Reset form
      setEmergencyType('');
      setSeverity('');
      setDescription('');
      setLocation('');

    } catch (error: any) {
      console.error('Error submitting emergency request:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit emergency request. Please try again.",
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            <strong>For life-threatening emergencies, call 911 immediately!</strong>
          </p>
        </div>

        <div>
          <Label htmlFor="emergency-type">Emergency Type</Label>
          <Select value={emergencyType || 'Medical Emergency'} onValueChange={setEmergencyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select emergency type" />
            </SelectTrigger>
            <SelectContent>
              {emergencyTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="severity">Severity Level</Label>
          <Select value={severity || 'Medium'} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity level" />
            </SelectTrigger>
            <SelectContent>
              {severityLevels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Current Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="location"
              placeholder="Enter your current location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the emergency situation in detail"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <Button 
          onClick={submitEmergencyRequest} 
          disabled={loading} 
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {loading ? 'Submitting...' : 'Submit Emergency Request'}
        </Button>

        {patientId && (
          <p className="text-sm text-gray-500 text-center">
            Emergency request will be submitted for the selected patient
          </p>
        )}
      </CardContent>
    </Card>
  );
};
