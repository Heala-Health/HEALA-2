
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText, Video, MessageSquare, Loader2 } from 'lucide-react';

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
  onAccept: (id: string, appointment: PendingAppointment) => void;
  onReject: (id: string, appointment: PendingAppointment) => void;
  onPrescribe: (id: string) => void;
  isProcessing?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onReject,
  onPrescribe,
  isProcessing = false
}) => {
  const isVirtual = appointment.consultation_type === 'virtual';
  const patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`;
  const formattedDate = new Date(appointment.appointment_date).toLocaleDateString();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-lg">
                {patientName}
              </h3>
              <Badge variant={isVirtual ? "default" : "secondary"} className="ml-2">
                {isVirtual ? (
                  <>
                    <Video className="w-3 h-3 mr-1" />
                    Virtual
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3 mr-1" />
                    In-Person
                  </>
                )}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{appointment.appointment_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{appointment.patient.email}</span>
              </div>
              {appointment.patient.phone && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3">📞</span>
                  <span>{appointment.patient.phone}</span>
                </div>
              )}
            </div>

            {appointment.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-start gap-2">
                  <FileText className="w-3 h-3 mt-0.5 text-gray-500" />
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1">{appointment.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={() => onAccept(appointment.id, appointment)}
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Accept {isVirtual ? 'Virtual' : 'In-Person'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(appointment.id, appointment)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Reject'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onPrescribe(appointment.id)}
            disabled={isProcessing}
          >
            <FileText className="w-4 h-4 mr-1" />
            Prescribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
