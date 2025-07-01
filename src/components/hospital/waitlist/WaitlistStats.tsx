
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { WaitlistEntry } from './types';

interface WaitlistStatsProps {
  waitlist: WaitlistEntry[];
}

export const WaitlistStats: React.FC<WaitlistStatsProps> = ({ waitlist }) => {
  const waitingCount = waitlist.filter(entry => entry.status === 'waiting').length;
  const averageWaitTime = waitlist.length > 0 
    ? Math.round(waitlist.reduce((acc, entry) => acc + entry.estimated_wait_time, 0) / waitlist.length)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Patients Waiting</p>
              <p className="text-2xl font-bold">{waitingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Wait Time</p>
              <p className="text-2xl font-bold">{averageWaitTime}min</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Today</p>
              <p className="text-2xl font-bold">{waitlist.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
