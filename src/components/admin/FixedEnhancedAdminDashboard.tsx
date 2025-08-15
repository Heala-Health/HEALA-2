
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Settings, AlertTriangle, FileText, Activity, Database, Key } from 'lucide-react';
import { FixedUserManagement } from './FixedUserManagement';
import { FixedSystemSettings } from './FixedSystemSettings';
import { FixedEmergencyManagement } from './FixedEmergencyManagement';
import { FixedComplianceReports } from './FixedComplianceReports';
import { AdminAuditLog } from './AdminAuditLog';

export const FixedEnhancedAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <FixedUserManagement />
        </TabsContent>

        <TabsContent value="settings">
          <FixedSystemSettings />
        </TabsContent>

        <TabsContent value="emergency">
          <FixedEmergencyManagement />
        </TabsContent>

        <TabsContent value="reports">
          <FixedComplianceReports />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLog />
        </TabsContent>

        <TabsContent value="system">
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Management</h3>
            <p className="text-gray-600">Advanced system configuration and monitoring tools.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
