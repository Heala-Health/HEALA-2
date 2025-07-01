
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
}

export const AppointmentBookingAgent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_email: '',
    physician_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchPhysicians();
  }, []);

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      if (error) throw error;
      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast({
        title: "Error",
        description: "Failed to load physicians.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Find patient by email
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.patient_email)
        .eq('role', 'patient')
        .single();

      if (patientError || !patientData) {
        toast({
          title: "Patient Not Found",
          description: "No patient found with this email address.",
          variant: "destructive"
        });
        return;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.id,
          physician_id: formData.physician_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          notes: formData.notes,
          status: 'confirmed'
        });

      if (appointmentError) throw appointmentError;

      // Add to assisted patients if not already there
      await supabase
        .from('agent_assisted_patients')
        .upsert({
          agent_id: user.id,
          patient_id: patientData.id,
          assistance_type: 'appointment',
          description: `Booked appointment with ${physicians.find(p => p.id === formData.physician_id)?.first_name} ${physicians.find(p => p.id === formData.physician_id)?.last_name}`
        }, { onConflict: 'agent_id,patient_id' });

      toast({
        title: "Appointment Booked",
        description: "The appointment has been successfully booked for the patient.",
      });

      // Reset form
      setFormData({
        patient_email: '',
        physician_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-6 h-6" />
          <span>Book Appointment for Patient</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient_email">Patient Email *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="patient_email"
                placeholder="patient@example.com"
                value={formData.patient_email}
                onChange={(e) => handleInputChange('patient_email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physician_id">Select Physician *</Label>
            <Select value={formData.physician_id} onValueChange={(value) => handleInputChange('physician_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a physician" />
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
                  min={new Date().toISOString().split('T')[0]}
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the appointment"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            disabled={loading}
          >
            {loading ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
