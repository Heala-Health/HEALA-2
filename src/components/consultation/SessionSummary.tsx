
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsultationSession } from './types';

interface SessionSummaryProps {
  session: ConsultationSession;
  formatDuration: (minutes: number) => string;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  formatDuration
}) => {
  if (session.status !== 'completed') return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-medium">{formatDuration(session.duration_minutes || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Status</p>
            <Badge variant={session.payment_status === 'paid' ? 'default' : 'secondary'}>
              {session.payment_status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
