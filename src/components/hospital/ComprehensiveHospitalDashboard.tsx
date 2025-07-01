
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Building } from 'lucide-react';
import { useHospitalData } from './hooks/useHospitalData';
import { HospitalDashboardHeader } from './HospitalDashboardHeader';
import { HospitalDashboardStats } from './HospitalDashboardStats';
import { HospitalOverview } from './HospitalOverview';
import { HospitalAnalytics } from './HospitalAnalytics';
import { HospitalOperationsManagement } from './HospitalOperationsManagement';
import { HospitalNotificationCenter } from './HospitalNotificationCenter';
import { PhysicianManagement } from './PhysicianManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { EmergencyCoordination } from './EmergencyCoordination';
import { HospitalFinancialManagement } from './HospitalFinancialManagement';
import { HospitalSecurityManagement } from './HospitalSecurityManagement';
import { HospitalComplianceManagement } from './HospitalComplianceManagement';
import { HospitalResourceManagement } from './HospitalResourceManagement';
import { HospitalAdvancedSettings } from './HospitalAdvancedSettings';
import { PatientManagement } from './PatientManagement';
import { useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const DashboardContent: React.FC = () => {
  const { hospitalInfo, stats, loading, profile } = useHospitalData();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  if (profile?.role !== 'hospital_admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the hospital dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile?.hospital_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">No Hospital Assignment</h3>
          <p className="text-gray-600">Your account is not associated with any hospital. Please contact an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner text="Loading hospital dashboard..." className="py-8" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <HospitalDashboardHeader hospitalInfo={hospitalInfo} />
            <HospitalDashboardStats stats={stats} />
            <HospitalOverview />
          </div>
        );
      case 'physicians':
        return <PhysicianManagement />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'patients':
        return <PatientManagement />;
      case 'emergency':
        return <EmergencyCoordination />;
      case 'financial':
        return <HospitalFinancialManagement />;
      case 'security':
        return <HospitalSecurityManagement />;
      case 'compliance':
        return <HospitalComplianceManagement />;
      case 'analytics':
        return <HospitalAnalytics />;
      case 'operations':
        return <HospitalOperationsManagement />;
      case 'notifications':
        return <HospitalNotificationCenter />;
      case 'resources':
        return <HospitalResourceManagement />;
      case 'settings':
        return <HospitalAdvancedSettings />;
      default:
        return (
          <div className="space-y-6">
            <HospitalDashboardHeader hospitalInfo={hospitalInfo} />
            <HospitalDashboardStats stats={stats} />
            <HospitalOverview />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <ErrorBoundary>
        {renderContent()}
      </ErrorBoundary>
    </div>
  );
};

export const ComprehensiveHospitalDashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
};
