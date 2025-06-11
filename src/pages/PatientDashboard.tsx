import React, { useState, useEffect } from 'react';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AmbulanceStatus } from '@/components/emergency/AmbulanceStatus';
import { ProfileEditor } from '@/components/patient/ProfileEditor';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { TransportManagement } from '@/components/patient/TransportManagement';
import { EmergencyManagement } from '@/components/patient/EmergencyManagement';
import { PatientSettings } from '@/components/patient/PatientSettings';
import { PhysicianAssignment } from '@/components/patient/PhysicianAssignment';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SubscriptionUpgrade } from '@/components/patient/SubscriptionUpgrade'; // Import SubscriptionUpgrade

// Enhanced components
import { EnhancedAppointmentBooking } from '@/components/enhanced-appointments/EnhancedAppointmentBooking';
import { PrescriptionManagement } from '@/components/prescriptions/PrescriptionManagement';
import { HealthRecordsAccess } from '@/components/health-records/HealthRecordsAccess';
import { SymptomChecker } from '@/components/symptom-checker/SymptomChecker';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';
import { EmergencyContacts } from '@/components/emergency/EmergencyContacts';
import { OfflineManager } from '@/components/offline/OfflineManager';
import { PhysicianConsultationHistory } from '@/components/patient/PhysicianConsultationHistory';
import { AgentContactInfo } from '@/components/patient/AgentContactInfo';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('Current tab from URL:', tab);
    
    // If no tab is specified, redirect to appointments tab
    if (!tab) {
      console.log('No tab specified, redirecting to appointments');
      navigate('/patient?tab=appointments', { replace: true });
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, navigate]);

  console.log('Rendering PatientDashboard with activeTab:', activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Book New Appointment</h3>
              <EnhancedAppointmentBooking />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">My Appointments</h3>
              <AppointmentList />
            </div>
          </div>
        );
      case 'chat':
        return <ChatInterface />;
      case 'ai-assistant':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                AI Health Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant health guidance and support from our AI assistant
              </p>
            </div>
            <UniversalBotpress />
          </div>
        );
      case 'prescriptions':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Prescription Management
            </h2>
            <PrescriptionManagement />
          </div>
        );
      case 'health-records':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Health Records
            </h2>
            <HealthRecordsAccess />
          </div>
        );
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
        // This PhysicianAssignment component might need to be updated to fetch actual assignments
        // For now, it remains as is, but the PhysicianConsultationHistory provides the requested physician history.
        return <PhysicianAssignment />;
      case 'physician-history': // New tab for patient's physician history
        return <PhysicianConsultationHistory />;
      case 'emergency':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Request Emergency</h3>
              <EmergencyRequest />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">My Emergency Requests</h3>
              <EmergencyManagement />
            </div>
          </div>
        );
      case 'profile':
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
      case 'transport':
        return <TransportManagement />;
      case 'subscription':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Manage Subscription
            </h2>
            <SubscriptionUpgrade />
          </div>
        );
      case 'ambulance':
        return <AmbulanceStatus />;
      case 'agent-contact':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Contact Agents
            </h2>
            <AgentContactInfo />
          </div>
        );
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

  return (
    <DashboardLayout title="Patient Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;
