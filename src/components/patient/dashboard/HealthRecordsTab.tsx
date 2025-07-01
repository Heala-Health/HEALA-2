
import React from 'react';
import { HealthRecordsAccess } from '@/components/health-records/HealthRecordsAccess';
import { MedicalHistoryUpload } from '@/components/medical-history/MedicalHistoryUpload';

export const HealthRecordsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Health Records
        </h2>
        <HealthRecordsAccess />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Medical History
        </h3>
        <MedicalHistoryUpload />
      </div>
    </div>
  );
};
