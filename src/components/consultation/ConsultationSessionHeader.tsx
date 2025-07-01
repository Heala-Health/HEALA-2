
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ConsultationSession, ConnectionStatus } from './types';

interface ConsultationSessionHeaderProps {
  session: ConsultationSession;
  connectionStatus: ConnectionStatus;
  sessionDuration: number;
  formatDuration: (minutes: number) => string;
}

export const ConsultationSessionHeader: React.FC<ConsultationSessionHeaderProps> = ({
  session,
  connectionStatus,
  sessionDuration,
  formatDuration
}) => {
  const { profile } = useAuth();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
            <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
              {profile?.role === 'patient' ? 'Dr. ' : ''}
              {profile?.role === 'patient' 
                ? `${session.physician?.first_name || 'Unknown'} ${session.physician?.last_name || ''}`
                : `${session.patient?.first_name || 'Unknown'} ${session.patient?.last_name || ''}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              {session.status === 'in_progress' ? formatDuration(sessionDuration) : 'Not started'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Rate: ₦{session.consultation_rate.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
