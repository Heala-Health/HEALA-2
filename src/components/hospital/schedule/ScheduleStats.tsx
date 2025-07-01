
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { StaffSchedule, StaffAttendance } from './types';

interface ScheduleStatsProps {
  schedules: StaffSchedule[];
  attendance: StaffAttendance[];
}

export const ScheduleStats: React.FC<ScheduleStatsProps> = ({ schedules, attendance }) => {
  const totalStaff = schedules.length;
  const checkedIn = attendance.filter(a => a.status === 'checked_in').length;
  const departments = [...new Set(schedules.map(s => s.department))];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff Scheduled</p>
              <p className="text-2xl font-bold">{totalStaff}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Currently On Duty</p>
              <p className="text-2xl font-bold">{checkedIn}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-2xl font-bold">{departments.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold">
                {totalStaff > 0 ? Math.round((checkedIn / totalStaff) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
