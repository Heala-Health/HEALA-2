
export type PatientDashboardTab = 
  | 'appointments'
  | 'wallet'
  | 'virtual-consultation'
  | 'chat'
  | 'ai-assistant'
  | 'prescriptions'
  | 'health-records'
  | 'symptom-checker'
  | 'emergency-contacts'
  | 'accessibility'
  | 'offline'
  | 'physician'
  | 'emergency'
  | 'profile'
  | 'transport'
  | 'subscription'
  | 'settings'
  | 'ambulance'
  | 'contact-agent';

export interface PatientDashboardProps {
  activeTab: PatientDashboardTab;
}
