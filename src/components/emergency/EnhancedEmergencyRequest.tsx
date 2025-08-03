
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Phone, MapPin, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRetry } from '@/hooks/useRetry';
import { handleError, showSuccess } from '@/lib/errorHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmergencyRequest, LocationData } from './types';

export const EnhancedEmergencyRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    emergency_type: '',
    description: '',
    pickup_address: '',
    contact_phone: '',
  });

  const { executeWithRetry, isRetrying } = useRetry(
    async (fn: () => Promise<void>) => await fn(),
    { maxRetries: 3, initialDelay: 1000 }
  );

  useEffect(() => {
    if (user) {
      fetchEmergencyRequests();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`emergency_requests_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Emergency request update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEmergencyRequests(prev => [payload.new as EmergencyRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEmergencyRequests(prev => 
              prev.map(req => 
                req.id === payload.new.id ? payload.new as EmergencyRequest : req
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_requests',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Ambulance request update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const ambulanceData = payload.new as any;
            
            toast({
              title: 'Ambulance Update',
              description: `ETA: ${ambulanceData.ambulance_eta || 'Unknown'} minutes`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchEmergencyRequests = async () => {
    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('emergency_requests')
          .select('*')
          .eq('patient_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEmergencyRequests(data || []);
      });
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      handleError(error, toast);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Available',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
      return;
    }

    setGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Simple reverse geocoding fallback
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      const locationData = { latitude, longitude, address };
      setLocationData(locationData);
      setFormData(prev => ({ ...prev, pickup_address: address }));
      
      showSuccess('Location detected successfully!', toast);
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Location Error',
        description: 'Could not get your location. Please enter your address manually.',
        variant: 'destructive',
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.emergency_type) return 'Please select an emergency type';
    if (!formData.pickup_address) return 'Please provide your location';
    if (!formData.contact_phone) return 'Please provide a contact phone number';
    if (!formData.description) return 'Please describe the emergency';
    
    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.contact_phone)) {
      return 'Please enter a valid phone number';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await executeWithRetry(async () => {
        const requestData = {
          emergency_type: formData.emergency_type,
          description: formData.description,
          patient_id: user?.id,
          status: 'pending',
          severity: 'medium',
          location_latitude: locationData?.latitude,
          location_longitude: locationData?.longitude,
          pickup_address: formData.pickup_address,
          contact_phone: formData.contact_phone,
        };

        const { data, error } = await supabase
          .from('emergency_requests')
          .insert(requestData)
          .select()
          .single();

        if (error) throw error;

        showSuccess('Emergency request submitted successfully!', toast);
        
        // Reset form
        setFormData({
          emergency_type: '',
          description: '',
          pickup_address: '',
          contact_phone: '',
        });
        setLocationData(null);
        
        // Fetch updated requests
        await fetchEmergencyRequests();
      });
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      handleError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Emergency Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>For life-threatening emergencies, call 911 immediately.</strong>
              <br />
              This form is for non-critical emergency transportation and medical assistance.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Emergency Type</label>
              <Select
                value={formData.emergency_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, emergency_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="injury">Injury/Accident</SelectItem>
                  <SelectItem value="transport">Emergency Transport</SelectItem>
                  <SelectItem value="psychiatric">Mental Health Crisis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe the emergency situation..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pickup Location</label>
              <div className="flex gap-2">
                <Input
                  value={formData.pickup_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
                  placeholder="Enter your address"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Get Location
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="Enter contact phone number"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="Submitting..." />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Submit Emergency Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Emergency Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Requests History</CardTitle>
        </CardHeader>
        <CardContent>
          {isRetrying && (
            <div className="mb-4">
              <LoadingSpinner size="sm" text="Refreshing..." />
            </div>
          )}
          
          {emergencyRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No emergency requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencyRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">{request.emergency_type}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {request.pickup_address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {request.pickup_address}
                      </div>
                    )}
                    {request.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {request.contact_phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {request.ambulance_eta && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <strong>ETA:</strong> {request.ambulance_eta} minutes
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
