
import React from 'react';
import { HospitalOverview } from '@/components/hospital/HospitalOverview';
import { PhysicianManagement } from '@/components/hospital/PhysicianManagement';
import { AppointmentManagement } from '@/components/hospital/AppointmentManagement';
import { EmergencyCoordination } from '@/components/hospital/EmergencyCoordination';
import { HospitalAnalytics } from '@/components/hospital/HospitalAnalytics';
import { HospitalPhysicianAssignment } from '@/components/hospital/HospitalPhysicianAssignment';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const HospitalDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HospitalOverview />;
      case 'physicians':
        return <PhysicianManagement />;
      case 'assign-physicians':
        return <HospitalPhysicianAssignment />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'emergency':
        return <EmergencyCoordination />;
      case 'analytics':
        return <HospitalAnalytics />;
      case 'ai-assistant':
        return <UniversalBotpress />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <DashboardLayout title="Hospital Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default HospitalDashboard;
