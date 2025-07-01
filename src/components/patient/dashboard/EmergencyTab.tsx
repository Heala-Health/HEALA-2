
import React from 'react';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { EmergencyManagement } from '@/components/patient/EmergencyManagement';

export const EmergencyTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Request Emergency</h3>
        <EmergencyRequest />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">My Emergency Requests</h3>
        <EmergencyManagement />
      </div>
    </div>
  );
};
