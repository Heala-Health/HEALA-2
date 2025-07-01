
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { AnalyticsMetrics as MetricsType } from './types';

interface AnalyticsMetricsProps {
  metrics: MetricsType;
}

export const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold">{metrics.totalAppointments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Physicians</p>
              <p className="text-2xl font-bold">{metrics.activePhysicians}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Emergency Requests</p>
              <p className="text-2xl font-bold">{metrics.emergencyRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold">{metrics.thisMonthAppointments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
