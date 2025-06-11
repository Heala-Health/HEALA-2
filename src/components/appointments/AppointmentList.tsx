
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const AppointmentList: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fetching appointments for user:', user.id, 'with role:', profile?.role);
      
      // Get appointments based on user role
      let query = supabase.from('appointments').select('*');
      
      if (profile?.role === 'physician') {
        query = query.eq('physician_id', user.id);
      } else {
        query = query.eq('patient_id', user.id);
      }
      
      const { data: appointmentsData, error: appointmentsError } = await query
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Fetched appointments:', appointmentsData);

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Get unique physician and patient IDs
      const physicianIds = [...new Set(appointmentsData.map(a => a.physician_id).filter(Boolean))];
      const patientIds = [...new Set(appointmentsData.map(a => a.patient_id).filter(Boolean))];

      console.log('Physician IDs:', physicianIds);
      console.log('Patient IDs:', patientIds);

      // Fetch physician profiles
      let physicians = [];
      if (physicianIds.length > 0) {
        const { data: physicianData, error: physicianError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, specialization')
          .in('id', physicianIds);

        if (physicianError) {
          console.error('Error fetching physicians:', physicianError);
        } else {
          physicians = physicianData || [];
        }
      }

      // Fetch patient profiles
      let patients = [];
      if (patientIds.length > 0) {
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', patientIds);

        if (patientError) {
          console.error('Error fetching patients:', patientError);
        } else {
          patients = patientData || [];
        }
      }

      console.log('Fetched physicians:', physicians);
      console.log('Fetched patients:', patients);

      // Combine the data
      const enrichedAppointments = appointmentsData.map(appointment => {
        const physician = physicians.find(p => p.id === appointment.physician_id);
        const patient = patients.find(p => p.id === appointment.patient_id);

        return {
          ...appointment,
          physician: physician ? {
            first_name: physician.first_name || 'Unknown',
            last_name: physician.last_name || 'Physician',
            specialization: physician.specialization || undefined
          } : undefined,
          patient: patient ? {
            first_name: patient.first_name || 'Unknown',
            last_name: patient.last_name || 'Patient',
            email: patient.email || ''
          } : undefined
        };
      });

      console.log('Enriched appointments:', enrichedAppointments);
      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string): boolean => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment cancelled successfully.",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-gray-600 dark:text-gray-300">Loading appointments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="w-5 h-5" />
          My Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No appointments scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </span>
                        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{appointment.appointment_time}</span>
                      </div>
                      {appointment.physician && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Dr. {appointment.physician.first_name} {appointment.physician.last_name}
                          {appointment.physician.specialization && ` - ${appointment.physician.specialization}`}
                        </p>
                      )}
                      {appointment.patient && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {appointment.patient.first_name} {appointment.patient.last_name}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && 
                     canCancelAppointment(appointment.appointment_date, appointment.appointment_time) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-700 dark:hover:border-red-600"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && 
                 !canCancelAppointment(appointment.appointment_date, appointment.appointment_time) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    * Appointments can only be cancelled 24 hours in advance
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
