
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComprehensiveHospitalDashboard } from '@/components/hospital/ComprehensiveHospitalDashboard';

const HospitalDashboard = () => {
  return (
    <DashboardLayout title="Hospital Dashboard">
      <ComprehensiveHospitalDashboard />
    </DashboardLayout>
  );
};

export default HospitalDashboard;
