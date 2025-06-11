import React, { useState, useEffect } from 'react';
import { PatientList } from '@/components/physician/PatientList';
import { PhysicianChatInterface } from '@/components/physician/PhysicianChatInterface';
import { PhysicianProfile } from '@/components/physician/PhysicianProfile';
import { PhysicianDocumentUpload } from '@/components/physician/PhysicianDocumentUpload';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';
import { PendingAppointments } from '@/components/physician/PendingAppointments';
import { PatientConsultationHistory } from '@/components/physician/PatientConsultationHistory';
import { PrescriptionInput } from '@/components/physician/PrescriptionInput';
import { PhysicianPrescriptionHistory } from '@/components/physician/PhysicianPrescriptionHistory';

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
      case 'patients':
        // This PatientList component might need to be updated to fetch actual patients
        // For now, it remains as is, but the PatientConsultationHistory provides the requested patient list.
        return <PatientList patients={[]} onStartConversation={() => {}} />;
      case 'patient-history': // New tab for patient consultation history
        return <PatientConsultationHistory />;
      case 'create-prescription': // New tab for creating prescriptions
        // You might pass patientId and appointmentId dynamically here if needed
        return <PrescriptionInput />;
      case 'prescription-history': // New tab for physician's prescription history
        return <PhysicianPrescriptionHistory />;
      case 'chat':
        return <PhysicianChatInterface />;
      case 'profile':
        return <PhysicianProfile />;
      case 'documents':
        return <PhysicianDocumentUpload />;
      case 'pending-appointments':
        return <PendingAppointments />;
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
