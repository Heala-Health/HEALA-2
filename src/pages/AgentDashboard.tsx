
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { PatientLookup } from '@/components/agent/PatientLookup';
import { AssistedPatients } from '@/components/agent/AssistedPatients';
import { FixedTransportBooking } from '@/components/agent/FixedTransportBooking';
import { AppointmentBookingAgent } from '@/components/agent/AppointmentBooking';
import { EnhancedAgentChatInterface } from '@/components/agent/EnhancedAgentChatInterface';
import { AgentSettings } from '@/components/agent/AgentSettings';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

const AgentDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);

  const handlePatientFound = (patient: PatientInfo) => {
    setSelectedPatient(patient);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'patient-lookup':
        return <PatientLookup onPatientFound={handlePatientFound} />;
      case 'assisted-patients':
        return <AssistedPatients />;
      case 'transport-booking':
        return <FixedTransportBooking />;
      case 'appointment-booking':
        return <AppointmentBookingAgent />;
      case 'chat':
        return <EnhancedAgentChatInterface />;
      case 'settings':
        return <AgentSettings />;
      default:
        return <DynamicOverview />;
    }
  };

  return (
    <DashboardLayout title="Agent Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AgentDashboard;
