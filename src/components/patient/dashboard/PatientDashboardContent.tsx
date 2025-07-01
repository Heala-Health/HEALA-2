import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { TransportManagement } from '@/components/patient/TransportManagement';
import { PatientSettings } from '@/components/patient/PatientSettings';
import { PhysicianAssignment } from '@/components/patient/PhysicianAssignment';
import { AmbulanceStatus } from '@/components/emergency/AmbulanceStatus';
import { SymptomChecker } from '@/components/symptom-checker/SymptomChecker';
import { EmergencyContacts } from '@/components/emergency/EmergencyContacts';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';
import { OfflineManager } from '@/components/offline/OfflineManager';
import { ContactAgent } from '@/components/patient/ContactAgent';
import { PatientAgentChat } from '@/components/patient/PatientAgentChat';

import { AppointmentsTab } from './AppointmentsTab';
import { WalletTab } from './WalletTab';
import { VirtualConsultationTab } from './VirtualConsultationTab';
import { AIAssistantTab } from './AIAssistantTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { EmergencyTab } from './EmergencyTab';
import { ProfileTab } from './ProfileTab';
import { SubscriptionTab } from './SubscriptionTab';
import { PatientDashboardTab } from './types';

interface PatientDashboardContentProps {
  activeTab: PatientDashboardTab;
}

export const PatientDashboardContent: React.FC<PatientDashboardContentProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'appointments':
      return <AppointmentsTab />;
    case 'wallet':
      return <WalletTab />;
    case 'virtual-consultation':
      return <VirtualConsultationTab />;
    case 'chat':
      return <ChatInterface />;
    case 'ai-assistant':
      return <AIAssistantTab />;
    case 'prescriptions':
      return <PrescriptionsTab />;
    case 'health-records':
      return <HealthRecordsTab />;
    case 'symptom-checker':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Symptom Checker
          </h2>
          <SymptomChecker />
        </div>
      );
    case 'emergency-contacts':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Emergency Contacts
          </h2>
          <EmergencyContacts />
        </div>
      );
    case 'contact-agent':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Chat with Agent
          </h2>
          <PatientAgentChat />
        </div>
      );
    case 'accessibility':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Accessibility Settings
          </h2>
          <AccessibilitySettings />
        </div>
      );
    case 'offline':
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Offline Access
          </h2>
          <OfflineManager />
        </div>
      );
    case 'physician':
      return <PhysicianAssignment />;
    case 'emergency':
      return <EmergencyTab />;
    case 'profile':
      return <ProfileTab />;
    case 'transport':
      return <TransportManagement />;
    case 'subscription':
      return <SubscriptionTab />;
    case 'settings':
      return <PatientSettings />;
    case 'ambulance':
      return <AmbulanceStatus />;
    default:
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Tab "{activeTab}" not found
          </h3>
          <p className="mt-2 text-gray-500">Please select a valid tab from the sidebar.</p>
        </div>
      );
  }
};
