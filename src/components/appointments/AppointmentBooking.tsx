import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types'; // Added import

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
}

interface AppointmentBookingProps {
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ 
  patientId, 
  patientName, 
  patientEmail 
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    physicianId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    consultationType: 'in_person', // Default to in-person
    virtualConsultationFee: '' // New state for virtual consultation fee
  });

  const effectivePatientId = patientId || user?.id;

  useEffect(() => {
    fetchPhysicians();
  }, []);

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      
      if (error) throw error;
      
      const formattedPhysicians = (data || []).map((physician: Physician) => ({
        id: physician.id,
        first_name: physician.first_name || 'Unknown',
        last_name: physician.last_name || '',
        specialization: physician.specialization || 'General',
        hospital_name: physician.hospital_name || 'Unknown Hospital'
      }));
      
      setPhysicians(formattedPhysicians);
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
    if (!effectivePatientId) {
      toast({
        title: "Error",
        description: "Patient ID is required to book appointment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let proceedWithBooking = true;
      let paymentAmount = 0;
      let paymentRequired = false;

      // Determine if payment is required and the amount
      if (profile?.role === 'patient') {
        if (formData.consultationType === 'in_person') {
          if (profile?.subscription_plan === 'basic') {
            // Check monthly in-person bookings for basic users
            const startOfMonth = new Date();
            startOfMonth.setDate(1); // Set to the first day of the month
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0); // Last day of the month
            endOfMonth.setHours(23, 59, 59, 999);

            const { count, error: countError } = await supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('patient_id', effectivePatientId)
              .eq('consultation_type', 'in_person')
              .in('status', ['confirmed', 'completed']) // Only count confirmed or completed appointments
              .gte('appointment_date', startOfMonth.toISOString().split('T')[0])
              .lte('appointment_date', endOfMonth.toISOString().split('T')[0]);

            if (countError) throw countError;

            if ((count || 0) >= 2) {
              paymentRequired = true;
              paymentAmount = 300; // Naira for additional in-person booking
              toast({
                title: "Additional Booking Fee",
                description: `You have exceeded your free in-person bookings. An additional fee of ${paymentAmount} Naira will be charged.`,
                variant: "default"
              });
            }
          } else if (profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise') {
            // Premium/Enterprise users have unlimited in-person bookings, no payment needed
            console.log('Premium/Enterprise user, unlimited in-person bookings.');
          }
        } else if (formData.consultationType === 'virtual') {
          // Virtual consultation payment
          const fee = parseFloat(formData.virtualConsultationFee);
          if (isNaN(fee) || fee < 5000 || fee > 15000) {
            toast({
              title: "Invalid Virtual Consultation Fee",
              description: "Please enter a virtual consultation fee between 5,000 and 15,000 Naira.",
              variant: "destructive"
            });
            setLoading(false);
            return; // Stop submission
          }
          paymentRequired = true;
          paymentAmount = fee;
          toast({
            title: "Virtual Consultation Fee",
            description: `A fee of ${paymentAmount} Naira will be charged for this virtual consultation.`,
            variant: "default"
          });
        }
      }

      if (paymentRequired) {
        // Call Supabase Edge Function for payment initialization
        const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke('process-appointment-payment', {
          body: JSON.stringify({
            amount: paymentAmount,
            patient_id: effectivePatientId,
            appointment_details: formData, // Pass full form data for metadata
          }),
        });

        if (paymentError) {
          throw new Error(`Payment processing failed: ${paymentError.message}`);
        }

        const paymentData = paymentResponse?.data;

        if (paymentData?.status === 'success' && paymentData?.data?.authorization_url) {
          // Redirect to Paystack for payment
          window.location.href = paymentData.data.authorization_url;
          proceedWithBooking = false; // Do not proceed with booking yet, wait for Paystack callback
        } else {
          throw new Error(`Payment initialization failed: ${paymentData?.message || 'Unknown error'}`);
        }
      }

      if (proceedWithBooking) {
        const { error } = await supabase
          .from('appointments')
          .insert({
            patient_id: effectivePatientId,
            physician_id: formData.physicianId,
            appointment_date: formData.appointmentDate,
            appointment_time: formData.appointmentTime,
            notes: formData.notes,
            consultation_type: formData.consultationType as Database['public']['Enums']['consultation_type'],
            status: 'pending'
          });

        if (error) throw error;

        toast({
          title: "Appointment Booked",
          description: `Appointment has been successfully booked${patientName ? ` for ${patientName}` : ''}.`,
        });

        // Reset form
        setFormData({
          physicianId: '',
          appointmentDate: '',
          appointmentTime: '',
          notes: '',
          consultationType: 'in_person', // Reset to default
          virtualConsultationFee: '' // Reset virtual consultation fee
        });
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
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
          Book Appointment
        </CardTitle>
        {(patientName || patientEmail) && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="w-4 h-4" />
              <span className="font-medium">
                Booking for: {patientName || patientEmail}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="physician">Select Physician</Label>
            <Select value={formData.physicianId || 'default'} onValueChange={(value) => setFormData({ ...formData, physicianId: value === 'default' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a physician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" disabled>Choose a physician</SelectItem>
                {physicians.map((physician) => (
                  <SelectItem key={physician.id} value={physician.id}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      <span>
                        Dr. {physician.first_name} {physician.last_name} - {physician.specialization}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="consultationType">Consultation Type</Label>
            <Select value={formData.consultationType} onValueChange={(value) => setFormData({ ...formData, consultationType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In-person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Appointment Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Appointment Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific concerns or notes for the physician"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {formData.consultationType === 'virtual' && (
            <div>
              <Label htmlFor="virtualConsultationFee">Virtual Consultation Fee (Naira)</Label>
              <Input
                id="virtualConsultationFee"
                type="number"
                placeholder="Enter fee (5000 - 15000)"
                value={formData.virtualConsultationFee}
                onChange={(e) => setFormData({ ...formData, virtualConsultationFee: e.target.value })}
                min="5000"
                max="15000"
                required={formData.consultationType === 'virtual'}
              />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
