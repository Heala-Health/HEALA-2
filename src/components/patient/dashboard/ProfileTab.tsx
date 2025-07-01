
import React from 'react';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { ProfileEditor } from '@/components/patient/ProfileEditor';

export const ProfileTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Basic Profile</h3>
        <PatientProfile />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Extended Profile</h3>
        <ProfileEditor />
      </div>
    </div>
  );
};
