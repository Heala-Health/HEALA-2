
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from './types';

interface AppointmentCardProps {
  appointment: Appointment;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Dr. {appointment.physician.first_name} {appointment.physician.last_name}
          </h4>
          <p className="text-sm text-gray-600">{appointment.physician.specialization}</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Scheduled
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            {format(new Date(appointment.appointment_date), 'PPP')}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            {appointment.appointment_time}
          </div>
          {appointment.physician.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              {appointment.physician.phone}
            </div>
          )}
        </div>

        {appointment.hospital && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              {appointment.hospital.name}
            </div>
            {appointment.hospital.address && (
              <p className="text-sm text-gray-600 ml-6">
                {appointment.hospital.address}
              </p>
            )}
            {appointment.hospital.phone && (
              <div className="flex items-center gap-2 text-sm ml-6">
                <Phone className="w-4 h-4 text-gray-400" />
                {appointment.hospital.phone}
              </div>
            )}
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <strong>Notes:</strong> {appointment.notes}
        </div>
      )}
    </div>
  );
};
