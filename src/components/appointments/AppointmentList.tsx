
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useAppointments } from './AppointmentList/hooks/useAppointments';
import { AppointmentCard } from './AppointmentList/components/AppointmentCard';
import { EmptyState } from './AppointmentList/components/EmptyState';
import { LoadingState } from './AppointmentList/components/LoadingState';
import { AppointmentListProps } from './AppointmentList/types';

export const AppointmentList: React.FC<AppointmentListProps> = ({ 
  externalAppointments, 
  onRefresh 
}) => {
  const { 
    appointments: fetchedAppointments, 
    loading, 
    cancelAppointment 
  } = useAppointments();

  // Use external appointments if provided, otherwise use fetched ones
  const appointments = externalAppointments || fetchedAppointments;

  const handleCancel = async (appointmentId: string) => {
    await cancelAppointment(appointmentId);
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading && !externalAppointments) {
    return <LoadingState />;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="w-5 h-5" />
          My Appointments ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
