
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  physician_id: string;
  notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

interface AppointmentCancellationProps {
  appointments: Appointment[];
  onAppointmentCancelled: () => void;
}

export const AppointmentCancellation: React.FC<AppointmentCancellationProps> = ({
  appointments,
  onAppointmentCancelled
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason || 'No reason provided'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled.",
      });

      setCancellingId(null);
      setCancellationReason('');
      onAppointmentCancelled();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive"
      });
    }
  };

  const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed');

  if (activeAppointments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">
            No active appointments to cancel
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cancel Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeAppointments.map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {appointment.status}
                  </Badge>
                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mb-2">{appointment.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cancellingId === appointment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for cancellation (optional)"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="w-64"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Confirm Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCancellingId(null);
                            setCancellationReason('');
                          }}
                        >
                          Keep Appointment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancellingId(appointment.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
