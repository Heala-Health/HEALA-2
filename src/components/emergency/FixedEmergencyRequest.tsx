
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const FixedEmergencyRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    emergency_type: '',
    severity: 'medium',
    description: '',
    contact_phone: '',
    pickup_address: '',
    location_latitude: null as number | null,
    location_longitude: null as number | null
  });

  const emergencyTypes = [
    'Medical Emergency',
    'Accident',
    'Cardiac Event',
    'Respiratory Distress',
    'Trauma',
    'Mental Health Crisis',
    'Other'
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location_latitude: position.coords.latitude,
          location_longitude: position.coords.longitude
        }));
        setLocationLoading(false);
        toast({
          title: "Location Captured",
          description: "Your current location has been captured successfully.",
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationLoading(false);
        toast({
          title: "Location Error",
          description: "Could not get your current location. Please enter your address manually.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const submitEmergencyRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit an emergency request.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.emergency_type || !formData.contact_phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in emergency type and contact phone.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.pickup_address && (!formData.location_latitude || !formData.location_longitude)) {
      toast({
        title: "Location Required",
        description: "Please provide either your address or allow location access.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .insert({
          patient_id: user.id,
          emergency_type: formData.emergency_type,
          severity: formData.severity,
          description: formData.description,
          contact_phone: formData.contact_phone,
          pickup_address: formData.pickup_address,
          location_latitude: formData.location_latitude,
          location_longitude: formData.location_longitude,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Emergency request error:', error);
        throw error;
      }

      toast({
        title: "Emergency Request Submitted",
        description: "Your emergency request has been submitted. Help is on the way!",
      });

      // Reset form
      setFormData({
        emergency_type: '',
        severity: 'medium',
        description: '',
        contact_phone: '',
        pickup_address: '',
        location_latitude: null,
        location_longitude: null
      });

    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit emergency request. Please try again or call emergency services directly.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          Emergency Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            For life-threatening emergencies, call emergency services immediately: <strong>199</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="emergency-type">Emergency Type *</Label>
            <Select
              value={formData.emergency_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, emergency_type: value }))}
            >
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

          <div>
            <Label htmlFor="severity">Severity Level</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <span className={level.color}>{level.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contact-phone">Contact Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="contact-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pickup-address">Pickup Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="pickup-address"
                placeholder="Enter your current address"
                value={formData.pickup_address}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
                className="pl-10"
              />
            </div>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </Button>
              {formData.location_latitude && formData.location_longitude && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Location captured
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <Button
            onClick={submitEmergencyRequest}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Submit Emergency Request
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
