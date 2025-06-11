
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  patient: {
    first_name: string;
    last_name: string;
  } | null;
  physician: {
    first_name: string;
    last_name: string;
    specialization: string;
  } | null;
}

export const AppointmentManagement: React.FC = () => {
  const { user } = useAuth();
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

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (!profile?.hospital_id) return;

      // First try with the basic query without joins
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data and fetch patient/physician info separately
      const appointmentsWithDetails = await Promise.all(
        (data || []).map(async (appointment) => {
          // Fetch patient details
          let patient = null;
          if (appointment.patient_id) {
            const { data: patientData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', appointment.patient_id)
              .single();
            patient = patientData;
          }

          // Fetch physician details
          let physician = null;
          if (appointment.physician_id) {
            const { data: physicianData } = await supabase
              .from('profiles')
              .select('first_name, last_name, specialization')
              .eq('id', appointment.physician_id)
              .single();
            physician = physicianData;
          }

          return {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            status: appointment.status,
            notes: appointment.notes,
            patient,
            physician
          };
        })
      );
      
      setAppointments(appointmentsWithDetails);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Management</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {appointment.patient ? 
                          `${appointment.patient.first_name} ${appointment.patient.last_name}` : 
                          'Patient Information Unavailable'
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.physician ? 
                          `Dr. ${appointment.physician.first_name} ${appointment.physician.last_name}` :
                          'Physician Information Unavailable'
                        }
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {appointment.appointment_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.appointment_time}
                      </div>
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      Notes: {appointment.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
