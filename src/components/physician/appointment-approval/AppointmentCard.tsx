
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Check, X, Video, Pill } from 'lucide-react';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface AppointmentCardProps {
  appointment: PendingAppointment;
  onAccept: (appointmentId: string, appointment: PendingAppointment) => void;
  onReject: (appointmentId: string, appointment: PendingAppointment) => void;
  onPrescribe: (appointmentId: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onReject,
  onPrescribe
}) => {
  const getConsultationTypeIcon = (type: string) => {
    return type === 'virtual' ? <Video className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getConsultationTypeBadge = (type: string) => {
    return type === 'virtual' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Virtual</Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">In-Person</Badge>
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              {getConsultationTypeIcon(appointment.consultation_type)}
              <span className="font-medium">
                {appointment.patient.first_name} {appointment.patient.last_name}
              </span>
              {getConsultationTypeBadge(appointment.consultation_type)}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(appointment.appointment_date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {appointment.appointment_time}
            </div>
            <div>{appointment.patient.email}</div>
            {appointment.patient.phone && <div>Phone: {appointment.patient.phone}</div>}
          </div>

          {appointment.notes && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Notes:</strong> {appointment.notes}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-col">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onAccept(appointment.id, appointment)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(appointment.id, appointment)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPrescribe(appointment.id)}
            className="w-full"
          >
            <Pill className="w-4 h-4 mr-1" />
            Prescribe
          </Button>
        </div>
      </div>
    </div>
  );
};
