import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/contexts/AuthContext'; // Import UserProfile type
import { Database } from '@/integrations/supabase/types'; // Added import

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  hospital_id: string;
}

export const EnhancedAppointmentBooking: React.FC = () => {
  const { user, profile } = useAuth(); // Destructure profile here
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [filteredPhysicians, setFilteredPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('all_hospitals');
  const [selectedLocation, setSelectedLocation] = useState('all_locations');
  const [formData, setFormData] = useState({
    physician_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    consultation_type: 'in_person' // Default to in-person
  });

  useEffect(() => {
    fetchHospitals();
    fetchPhysicians();
  }, []);

  useEffect(() => {
    filterPhysicians();
  }, [searchTerm, selectedHospital, selectedLocation, physicians]);

  const fetchHospitals = async () => {
    try {
      console.log('Fetching hospitals...');
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching hospitals:', error);
        throw error;
      }
      
      console.log('Hospitals fetched:', data?.length || 0);
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: "Error",
        description: "Failed to load hospitals. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const fetchPhysicians = async () => {
    try {
      console.log('Fetching physicians...');
      const { data, error } = await supabase.rpc('get_available_physicians');
      
      if (error) {
        console.error('Error fetching physicians:', error);
        throw error;
      }
      
      const physiciansWithHospital = (data || []).map((physician: Physician) => ({ // Fixed 'any' type
        ...physician,
        hospital_name: physician.hospital_name || 'Independent Practice'
      }));
      
      console.log('Physicians fetched:', physiciansWithHospital.length);
      setPhysicians(physiciansWithHospital);
      setFilteredPhysicians(physiciansWithHospital);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast({
        title: "Error",
        description: "Failed to load physicians. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const filterPhysicians = () => {
    let filtered = physicians;

    // Filter by search term (name or specialization)
    if (searchTerm) {
      filtered = filtered.filter(physician =>
        `${physician.first_name} ${physician.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        physician.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by hospital
    if (selectedHospital && selectedHospital !== 'all_hospitals') {
      filtered = filtered.filter(physician => physician.hospital_id === selectedHospital);
    }

    // Filter by location (city/state)
    if (selectedLocation && selectedLocation !== 'all_locations') {
      const selectedHospitalData = hospitals.find(h => h.id === selectedLocation);
      if (selectedHospitalData) {
        filtered = filtered.filter(physician => physician.hospital_id === selectedLocation);
      }
    }

    setFilteredPhysicians(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to book an appointment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Booking appointment for user:', user.id);
      
      // Subscription logic
      if (profile?.role === 'patient' && profile?.subscription_plan === 'basic' && formData.consultation_type === 'in_person') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { count, error: countError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id)
          .eq('consultation_type', 'in_person')
          .gte('appointment_date', startOfMonth.toISOString().split('T')[0])
          .lte('appointment_date', endOfMonth.toISOString().split('T')[0]);

        if (countError) throw countError;

        if ((count || 0) >= 2) {
          const amount = 300;
          toast({
            title: "Additional Booking Fee",
            description: `You have exceeded your free in-person bookings. An additional fee of ${amount} Naira will be charged.`,
            variant: "default"
          });

          const { data: paymentData, error: paymentError } = await supabase.functions.invoke('process-appointment-payment', {
            body: JSON.stringify({
              amount: amount,
              patient_id: user.id,
            }),
          });

          if (paymentError) {
            throw new Error(`Payment processing failed: ${paymentError.message}`);
          }
          if (paymentData?.data?.status !== 'success') {
            throw new Error(`Payment failed: ${paymentData?.data?.message || 'Unknown error'}`);
          }
          toast({
            title: "Payment Successful",
            description: "Your additional booking fee has been processed.",
          });
        }
      }

      const appointmentData = {
        patient_id: user.id,
        physician_id: formData.physician_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        notes: formData.reason,
        consultation_type: formData.consultation_type as Database['public']['Enums']['consultation_type'], // Explicitly cast
        status: 'pending' as Database['public']['Enums']['appointment_status'] // Explicitly cast
      };

      console.log('Inserting appointment:', appointmentData);

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) {
        console.error('Error booking appointment:', error);
        throw error;
      }

      console.log('Appointment booked successfully');

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully booked.",
      });

      // Reset form
      setFormData({
        physician_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        consultation_type: 'in_person' // Reset to default
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-6 h-6" />
          <span>Book Appointment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search and Filter Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Find a Physician</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search by Name or Specialty</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search physicians..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital">Filter by Hospital</Label>
                <Select value={selectedHospital || 'all_hospitals'} onValueChange={setSelectedHospital}>
                  <SelectTrigger>
                    <SelectValue placeholder="All hospitals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_hospitals">All hospitals</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Filter by Location</Label>
                <Select value={selectedLocation || 'all_locations'} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_locations">All locations</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.city}, {hospital.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Consultation Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="consultation_type">Consultation Type *</Label>
            <Select value={formData.consultation_type} onValueChange={(value) => handleInputChange('consultation_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In-person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Physician Selection */}
          <div className="space-y-2">
            <Label htmlFor="physician_id">Select Physician *</Label>
            <Select value={formData.physician_id || 'select_physician'} onValueChange={(value) => handleInputChange('physician_id', value === 'select_physician' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a physician" />
              </SelectTrigger>
              <SelectContent>
                {filteredPhysicians.length === 0 ? (
                  <SelectItem value="no_physicians" disabled>No physicians found</SelectItem>
                ) : (
                  <>
                    <SelectItem value="select_physician" disabled>Choose a physician</SelectItem>
                    {filteredPhysicians.map((physician) => (
                      <SelectItem key={physician.id} value={physician.id}>
                        <div className="flex flex-col">
                          <span>Dr. {physician.first_name} {physician.last_name}</span>
                          <span className="text-sm text-gray-500">
                            {physician.specialization} • {physician.hospital_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                  className="pl-10"
                  min={minDate}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="Describe your symptoms or reason for the appointment"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={loading || !formData.physician_id || !formData.appointment_date || !formData.appointment_time}
          >
            {loading ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
