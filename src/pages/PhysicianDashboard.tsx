
import React, { useState, useEffect } from 'react';
import { PatientList } from '@/components/physician/PatientList';
import { PhysicianChatInterface } from '@/components/physician/PhysicianChatInterface';
import { PhysicianProfile } from '@/components/physician/PhysicianProfile';
import { PhysicianDocumentUpload } from '@/components/physician/PhysicianDocumentUpload';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { AppointmentApproval } from '@/components/physician/AppointmentApproval';
import { PatientManagement } from '@/components/physician/PatientManagement';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DigitalWallet } from '@/components/wallet/DigitalWallet';
import { VirtualConsultationRoom } from '@/components/consultation/VirtualConsultationRoom';
import { useSearchParams } from 'react-router-dom';

const PhysicianDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DynamicOverview />;
      case 'appointments':
        return <AppointmentApproval />;
      case 'patients':
        return <PatientManagement />;
      case 'chat':
        return <PhysicianChatInterface />;
      case 'wallet':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Digital Wallet
            </h2>
            <DigitalWallet />
          </div>
        );
      case 'virtual-consultation':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Virtual Consultation Room
            </h2>
            <VirtualConsultationRoom sessionId={searchParams.get('session')} />
          </div>
        );
      case 'profile':
        return <PhysicianProfile />;
      case 'documents':
        return <PhysicianDocumentUpload />;
      default:
        return <DynamicOverview />;
    }
  };

  return (
    <DashboardLayout title="Physician Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default PhysicianDashboard;
