
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, FileText, TrendingUp, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PhysicianStats {
  todayAppointments: number;
  totalPatients: number;
  pendingReviews: number;
  rating: number;
}

interface TodayAppointment {
  id: string;
  appointment_time: string;
  status: string;
  patient: {
    first_name: string;
    last_name: string;
  } | null;
  notes?: string;
}

export const DynamicOverview: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<PhysicianStats>({
    todayAppointments: 0,
    totalPatients: 0,
    pendingReviews: 0,
    rating: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);

  useEffect(() => {
    if (user) {
      fetchPhysicianStats();
      fetchTodayAppointments();
    }
  }, [user]);

  const fetchPhysicianStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [todayResult, patientsResult, reviewsResult, metricsResult] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('physician_id', user.id).eq('appointment_date', today),
        supabase.from('physician_patients').select('*', { count: 'exact', head: true })
          .eq('physician_id', user.id).eq('status', 'active'),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('physician_id', user.id).eq('status', 'pending'),
        supabase.from('performance_metrics').select('metric_value')
          .eq('user_id', user.id).eq('metric_type', 'patient_satisfaction')
      ]);

      const avgRating = metricsResult.data?.length > 0 
        ? metricsResult.data.reduce((sum, m) => sum + Number(m.metric_value), 0) / metricsResult.data.length
        : 0;

      setStats({
        todayAppointments: todayResult.count || 0,
        totalPatients: patientsResult.count || 0,
        pendingReviews: reviewsResult.count || 0,
        rating: Math.round(avgRating * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching physician stats:', error);
    }
  };

  const fetchTodayAppointments = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch appointments first, then get patient details separately
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('physician_id', user.id)
        .eq('appointment_date', today)
        .order('appointment_time');

      if (error) throw error;
      
      // Transform the data and fetch patient info separately
      const appointmentsWithPatients = await Promise.all(
        (data || []).map(async (appointment) => {
          let patient = null;
          if (appointment.patient_id) {
            const { data: patientData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', appointment.patient_id)
              .single();
            patient = patientData;
          }

          return {
            id: appointment.id,
            appointment_time: appointment.appointment_time,
            status: appointment.status,
            notes: appointment.notes,
            patient
          };
        })
      );
      
      setTodayAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Record performance metric
      if (status === 'completed') {
        await supabase
          .from('performance_metrics')
          .insert({
            user_id: user?.id,
            metric_type: 'appointment_completed',
            metric_value: 1
          });
      }

      toast({
        title: "Success",
        description: `Appointment ${status} successfully.`,
      });

      fetchTodayAppointments();
      fetchPhysicianStats();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment.",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              <div className="text-sm text-gray-600">Today's Appointments</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <div className="text-sm text-gray-600">Total Patients</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats.pendingReviews}</div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{stats.rating}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">
                      {appointment.patient ? 
                        `${appointment.patient.first_name} ${appointment.patient.last_name}` : 
                        'Patient Information Unavailable'
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {appointment.appointment_time} - {appointment.notes || 'No notes'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    {appointment.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
