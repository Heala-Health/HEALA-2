
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '../types';
import { canCancelAppointment } from '../services/appointmentService';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (appointmentId: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onCancel }) => {
  const { profile } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const canCancel = canCancelAppointment(appointment.appointment_date, appointment.appointment_time);
  const showCancelButton = appointment.status !== 'cancelled' && 
                           appointment.status !== 'completed' && 
                           canCancel;

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
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
              <Badge variant="outline" className="ml-2">
                {appointment.consultation_type}
              </Badge>
            </div>
            
            {appointment.physician && profile?.role === 'patient' && (
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <User className="w-3 h-3" />
                Dr. {appointment.physician.first_name} {appointment.physician.last_name}
                {appointment.physician.specialization && ` - ${appointment.physician.specialization}`}
              </p>
            )}
            
            {appointment.patient && profile?.role === 'physician' && (
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
          {showCancelButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(appointment.id)}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-700 dark:hover:border-red-600"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>
      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && 
       !canCancel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          * Appointments can only be cancelled 24 hours in advance
        </p>
      )}
    </div>
  );
};
