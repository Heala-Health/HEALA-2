
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MapPin, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const FixedEmergencyRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    severity: 'medium',
    contactPhone: '',
    locationLatitude: null as number | null,
    locationLongitude: null as number | null,
    pickupAddress: ''
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationLatitude: position.coords.latitude,
          locationLongitude: position.coords.longitude
        }));
        setLocationLoading(false);
        toast({
          title: "Location Captured",
          description: "Your current location has been captured for emergency services.",
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationLoading(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please enter your address manually.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.emergencyType || !formData.contactPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in emergency type and contact phone.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .insert({
          patient_id: user.id,
          emergency_type: formData.emergencyType,
          description: formData.description,
          severity: formData.severity,
          contact_phone: formData.contactPhone,
          location_latitude: formData.locationLatitude,
          location_longitude: formData.locationLongitude,
          pickup_address: formData.pickupAddress,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Emergency Request Sent",
        description: "Your emergency request has been submitted. Help is on the way!",
      });

      // Reset form
      setFormData({
        emergencyType: '',
        description: '',
        severity: 'medium',
        contactPhone: '',
        locationLatitude: null,
        locationLongitude: null,
        pickupAddress: ''
      });
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast({
        title: "Error",
        description: "Failed to submit emergency request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="bg-red-100 border-b border-red-200">
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-6 h-6" />
          Emergency Request
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="emergencyType" className="text-red-800">Emergency Type *</Label>
            <Select 
              value={formData.emergencyType} 
              onValueChange={(value) => setFormData({ ...formData, emergencyType: value })}
              required
            >
              <SelectTrigger className="border-red-200">
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical Emergency</SelectItem>
                <SelectItem value="cardiac">Cardiac Emergency</SelectItem>
                <SelectItem value="respiratory">Breathing Difficulty</SelectItem>
                <SelectItem value="trauma">Injury/Trauma</SelectItem>
                <SelectItem value="mental_health">Mental Health Crisis</SelectItem>
                <SelectItem value="stroke">Stroke</SelectItem>
                <SelectItem value="overdose">Drug Overdose</SelectItem>
                <SelectItem value="other">Other Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contactPhone" className="text-red-800">Contact Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-red-600" />
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="Your phone number"
                className="pl-10 border-red-200"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="severity" className="text-red-800">Severity Level</Label>
            <Select 
              value={formData.severity} 
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger className="border-red-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Stable condition</SelectItem>
                <SelectItem value="medium">Medium - Needs attention</SelectItem>
                <SelectItem value="high">High - Urgent care needed</SelectItem>
                <SelectItem value="critical">Critical - Life threatening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-red-800">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the emergency situation..."
              className="border-red-200"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="pickupAddress" className="text-red-800">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-600" />
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="Your current address"
                className="pl-10 border-red-200"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getLocation}
              disabled={locationLoading}
              className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
            >
              {locationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Current Location
                </>
              )}
            </Button>
            {formData.locationLatitude && formData.locationLongitude && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Location captured: {formData.locationLatitude.toFixed(6)}, {formData.locationLongitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Submit Emergency Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
