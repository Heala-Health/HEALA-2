
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, AlertTriangle, Activity } from 'lucide-react';

interface DashboardStats {
  total_physicians: number;
  active_physicians: number;
  total_appointments: number;
  today_appointments: number;
  total_patients: number;
  emergency_requests: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

interface HospitalDashboardStatsProps {
  stats: DashboardStats;
}

export const HospitalDashboardStats: React.FC<HospitalDashboardStatsProps> = ({
  stats
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Physicians</p>
              <p className="text-2xl font-bold">{stats.total_physicians}</p>
              <p className="text-xs text-green-600">{stats.active_physicians} active</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold">{stats.today_appointments}</p>
              <p className="text-xs text-gray-500">of {stats.total_appointments} total</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emergency Alerts</p>
              <p className="text-2xl font-bold text-red-600">{stats.emergency_requests}</p>
              <p className="text-xs text-gray-500">pending response</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold">{stats.occupancy_rate}%</p>
              <p className="text-xs text-gray-500">current capacity</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
