
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Bell } from 'lucide-react';
import { OverviewStats } from './overview/OverviewStats';
import { HospitalAnalytics } from './HospitalAnalytics';
import { HospitalNotificationCenter } from './HospitalNotificationCenter';
import { HospitalResourceManagement } from './HospitalResourceManagement';

export const HospitalOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Hospital Overview</h2>
      </div>

      <OverviewStats />

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <HospitalAnalytics />
        </TabsContent>

        <TabsContent value="notifications">
          <HospitalNotificationCenter />
        </TabsContent>

        <TabsContent value="resources">
          <HospitalResourceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
