
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, XCircle } from 'lucide-react';
import { StaffSchedule } from './types';
import { getShiftColor, getStatusColor } from './utils';

interface ScheduleCardProps {
  schedule: StaffSchedule;
  onMarkAttendance: (scheduleId: string, staffId: string, action: 'check_in' | 'check_out') => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onMarkAttendance }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{schedule.staff_name}</h4>
          <p className="text-sm text-gray-600">{schedule.department}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getShiftColor(schedule.shift_type)}>
            {schedule.shift_type}
          </Badge>
          <Badge className={getStatusColor(schedule.status)}>
            {schedule.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Shift Time</p>
          <p className="text-sm">{schedule.start_time} - {schedule.end_time}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm capitalize">{schedule.staff_role}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Date Range</p>
          <p className="text-sm">{schedule.start_date} to {schedule.end_date}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onMarkAttendance(schedule.id, schedule.staff_id, 'check_in')}
        >
          <UserCheck className="w-4 h-4 mr-1" />
          Check In
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onMarkAttendance(schedule.id, schedule.staff_id, 'check_out')}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Check Out
        </Button>
      </div>
    </div>
  );
};
