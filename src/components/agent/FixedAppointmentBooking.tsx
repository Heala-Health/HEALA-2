
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
}

export const FixedAppointmentBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    patient_id: '',
    physician_id: '',
    appointment_date: '',
    appointment_time: '',
    consultation_type: 'in_person',
    notes: ''
  });

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'patient')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      if (error) throw error;
      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchPhysicians();
  }, []);

  const bookAppointment = async () => {
    if (!bookingData.patient_id || !bookingData.physician_id || !bookingData.appointment_date || !bookingData.appointment_time) {
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
        .from('appointments')
        .insert({
          patient_id: bookingData.patient_id,
          physician_id: bookingData.physician_id,
          appointment_date: bookingData.appointment_date,
          appointment_time: bookingData.appointment_time,
          consultation_type: bookingData.consultation_type,
          notes: bookingData.notes,
          agent_id: user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update assisted patient record
      await supabase
        .from('agent_assisted_patients')
        .upsert({
          agent_id: user?.id,
          patient_id: bookingData.patient_id,
          assistance_type: 'appointment_booking',
          status: 'active',
          appointment_booking_count: 1
        });

      toast({
        title: "Success",
        description: "Appointment booked successfully.",
      });

      setBookingData({
        patient_id: '',
        physician_id: '',
        appointment_date: '',
        appointment_time: '',
        consultation_type: 'in_person',
        notes: ''
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment.",
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
          <Calendar className="w-5 h-5" />
          Book Appointment for Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Patient</label>
          <Select value={bookingData.patient_id} onValueChange={(value) => setBookingData(prev => ({ ...prev, patient_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Select Physician</label>
          <Select value={bookingData.physician_id} onValueChange={(value) => setBookingData(prev => ({ ...prev, physician_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a physician..." />
            </SelectTrigger>
            <SelectContent>
              {physicians.map((physician) => (
                <SelectItem key={physician.id} value={physician.id}>
                  Dr. {physician.first_name} {physician.last_name} - {physician.specialization}
                  {physician.hospital_name && ` (${physician.hospital_name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Appointment Date</label>
            <Input
              type="date"
              value={bookingData.appointment_date}
              onChange={(e) => setBookingData(prev => ({ ...prev, appointment_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Appointment Time</label>
            <Input
              type="time"
              value={bookingData.appointment_time}
              onChange={(e) => setBookingData(prev => ({ ...prev, appointment_time: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Consultation Type</label>
          <Select value={bookingData.consultation_type} onValueChange={(value) => setBookingData(prev => ({ ...prev, consultation_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Notes (Optional)</label>
          <Input
            value={bookingData.notes}
            onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes for the appointment..."
          />
        </div>

        <Button onClick={bookAppointment} disabled={loading} className="w-full">
          <Calendar className="w-4 h-4 mr-2" />
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </CardContent>
    </Card>
  );
};
