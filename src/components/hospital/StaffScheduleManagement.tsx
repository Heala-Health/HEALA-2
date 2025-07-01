
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, AlertCircle } from 'lucide-react';
import { useStaffSchedule } from './schedule/useStaffSchedule';
import { ScheduleStats } from './schedule/ScheduleStats';
import { ScheduleCard } from './schedule/ScheduleCard';
import { AddScheduleDialog } from './schedule/AddScheduleDialog';
import { getStatusColor } from './schedule/utils';
import { Badge } from '@/components/ui/badge';

export const StaffScheduleManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { schedules, attendance, loading, markAttendance, fetchSchedules } = useStaffSchedule(selectedDate);

  if (loading) {
    return <div className="p-6">Loading schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Staff Schedule Management</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      <ScheduleStats schedules={schedules} attendance={attendance} />

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No staff scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <ScheduleCard 
                      key={schedule.id} 
                      schedule={schedule} 
                      onMarkAttendance={markAttendance}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance records for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendance.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{record.staff_name}</h4>
                        </div>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Check In</p>
                          <p className="text-sm">
                            {record.check_in_time 
                              ? new Date(record.check_in_time).toLocaleTimeString()
                              : 'Not checked in'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Check Out</p>
                          <p className="text-sm">
                            {record.check_out_time 
                              ? new Date(record.check_out_time).toLocaleTimeString()
                              : 'Not checked out'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddScheduleDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddSchedule={fetchSchedules}
      />
    </div>
  );
};
