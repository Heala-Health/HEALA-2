
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Activity } from 'lucide-react';
import { PatientWaitlistManagement } from './PatientWaitlistManagement';
import { StaffScheduleManagement } from './StaffScheduleManagement';
import { HospitalResourceManagement } from './HospitalResourceManagement';

export const HospitalOperationsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Hospital Operations</h2>
      </div>

      <Tabs defaultValue="waitlist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="waitlist" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Patient Waitlist
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Staff Scheduling
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waitlist">
          <PatientWaitlistManagement />
        </TabsContent>

        <TabsContent value="scheduling">
          <StaffScheduleManagement />
        </TabsContent>

        <TabsContent value="resources">
          <HospitalResourceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
