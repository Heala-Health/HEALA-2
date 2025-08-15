
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Car, MapPin, Clock, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const FixedTransportBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientEmail, setPatientEmail] = useState('');
  const [formData, setFormData] = useState({
    pickupAddress: '',
    destinationAddress: '',
    scheduledDate: '',
    scheduledTime: '',
    transportType: 'standard',
    notes: ''
  });

  const searchPatient = async () => {
    if (!patientEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a patient's email address",
        variant: "destructive"
      });
      return;
    }

    setSearchingPatient(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('email', patientEmail.trim())
        .eq('role', 'patient')
        .single();

      if (error || !profiles) {
        toast({
          title: "Patient Not Found",
          description: "No patient found with this email address",
          variant: "destructive"
        });
        setSelectedPatient(null);
        return;
      }

      setSelectedPatient(profiles);
      toast({
        title: "Patient Found",
        description: `Found patient: ${profiles.first_name} ${profiles.last_name}`,
      });
    } catch (error) {
      console.error('Error searching for patient:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for patient",
        variant: "destructive"
      });
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient) {
      toast({
        title: "Missing Information",
        description: "Please select a patient first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: selectedPatient.id,
          agent_id: user.id,
          pickup_address: formData.pickupAddress,
          destination_address: formData.destinationAddress,
          scheduled_time: scheduledDateTime.toISOString(),
          transport_type: formData.transportType,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: `Transport has been successfully booked for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
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
      setSelectedPatient(null);
      setPatientEmail('');
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="patientEmail">Patient Email</Label>
              <Input
                id="patientEmail"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="Enter patient's email address"
                onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="button" 
                onClick={searchPatient} 
                disabled={searchingPatient}
                variant="outline"
              >
                {searchingPatient ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {selectedPatient && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Selected Patient:</h4>
              <p className="text-green-700">
                {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.email})
              </p>
              {selectedPatient.phone && (
                <p className="text-green-600 text-sm">Phone: {selectedPatient.phone}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

            <Button 
              type="submit" 
              disabled={loading || !selectedPatient} 
              className="w-full"
            >
              {loading ? 'Booking...' : 'Book Transport for Patient'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
