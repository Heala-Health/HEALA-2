
import React from 'react';
import { PrescriptionManagement } from '@/components/prescriptions/PrescriptionManagement';
import { PrescriptionNotifications } from '@/components/prescriptions/PrescriptionNotifications';

export const PrescriptionsTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Prescription Management
      </h2>
      <PrescriptionNotifications />
      <PrescriptionManagement />
    </div>
  );
};
