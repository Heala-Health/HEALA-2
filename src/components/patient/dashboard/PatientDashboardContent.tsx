
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentsTab } from './AppointmentsTab';
import { WalletTab } from './WalletTab';
import { EnhancedVirtualConsultationTab } from './EnhancedVirtualConsultationTab';
import { EmergencyTab } from './EmergencyTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { AIAssistantTab } from './AIAssistantTab';
import { SubscriptionTab } from './SubscriptionTab';
import { ProfileTab } from './ProfileTab';
import { SymptomCheckerTab } from './SymptomCheckerTab';
import { ChatTab } from './ChatTab';
import { EmergencyContactsTab } from './EmergencyContactsTab';
import { ContactAgentTab } from './ContactAgentTab';
import { PhysicianTab } from './PhysicianTab';
import { TransportTab } from './TransportTab';
import { SettingsTab } from './SettingsTab';
import { AccessibilityTab } from './AccessibilityTab';
import { OfflineTab } from './OfflineTab';
import { AmbulanceTab } from './AmbulanceTab';
import { PatientDashboardTab } from './types';

interface PatientDashboardContentProps {
  activeTab?: PatientDashboardTab;
}

export const PatientDashboardContent: React.FC<PatientDashboardContentProps> = ({ 
  activeTab = 'appointments'
}) => {
  const { profile } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentsTab />;
      case 'wallet':
        return <WalletTab />;
      case 'virtual-consultation':
        return <EnhancedVirtualConsultationTab />;
      case 'emergency':
        return <EmergencyTab />;
      case 'health-records':
        return <HealthRecordsTab />;
      case 'prescriptions':
        return <PrescriptionsTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'profile':
        return <ProfileTab />;
      case 'symptom-checker':
        return <SymptomCheckerTab />;
      case 'chat':
        return <ChatTab />;
      case 'emergency-contacts':
        return <EmergencyContactsTab />;
      case 'contact-agent':
        return <ContactAgentTab />;
      case 'physician':
        return <PhysicianTab />;
      case 'transport':
        return <TransportTab />;
      case 'settings':
        return <SettingsTab />;
      case 'accessibility':
        return <AccessibilityTab />;
      case 'offline':
        return <OfflineTab />;
      case 'ambulance':
        return <AmbulanceTab />;
      default:
        return <AppointmentsTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {getWelcomeMessage()}, {profile?.first_name || 'Patient'}!
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                How can we help you with your health today?
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {profile?.subscription_plan || 'Basic'} Plan
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Dynamic Content Based on Active Tab */}
      {renderTabContent()}
    </div>
  );
};
