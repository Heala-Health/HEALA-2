
import React from 'react';
import { Calendar, MessageCircle, Bot, Users, Phone, FileText, Settings, Pill, Heart, Search, Shield, Wifi, Map, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/logo';

const patientMenuItems = [
  { title: 'Appointments', url: '/patient?tab=appointments', icon: Calendar },
  { title: 'Chat', url: '/patient?tab=chat', icon: MessageCircle },
  { title: 'AI Assistant', url: '/patient?tab=ai-assistant', icon: Bot },
  { title: 'Prescriptions', url: '/patient?tab=prescriptions', icon: Pill },
  { title: 'Health Records', url: '/patient?tab=health-records', icon: FileText },
  { title: 'Symptom Checker', url: '/patient?tab=symptom-checker', icon: Search },
  { title: 'Emergency Contacts', url: '/patient?tab=emergency-contacts', icon: Phone },
  { title: 'Physician', url: '/patient?tab=physician', icon: Users },
  { title: 'Emergency', url: '/patient?tab=emergency', icon: Heart },
  { title: 'Transport', url: '/patient?tab=transport', icon: Map },
  { title: 'Profile', url: '/patient?tab=profile', icon: Users },
  { title: 'Accessibility', url: '/patient?tab=accessibility', icon: Shield },
  { title: 'Offline Access', url: '/patient?tab=offline', icon: Wifi },
  { title: 'Subscription', url: '/patient?tab=subscription', icon: Settings }, // Updated title
  { title: 'Contact Agents', url: '/patient?tab=agent-contact', icon: Phone }, // New item for nearby agents
];

const physicianMenuItems = [
  { title: 'Overview', url: '/physician?tab=overview', icon: Home },
  { title: 'Patients', url: '/physician?tab=patients', icon: Users },
  { title: 'Chat', url: '/physician?tab=chat', icon: MessageCircle },
  { title: 'Profile', url: '/physician?tab=profile', icon: Users },
  { title: 'Documents', url: '/physician?tab=documents', icon: FileText },
];

const hospitalMenuItems = [
  { title: 'Overview', url: '/hospital?tab=overview', icon: Calendar },
  { title: 'Physicians', url: '/hospital?tab=physicians', icon: Users },
  { title: 'Appointments', url: '/hospital?tab=appointments', icon: Calendar },
  { title: 'Emergency', url: '/hospital?tab=emergency', icon: Heart },
  { title: 'Analytics', url: '/hospital?tab=analytics', icon: FileText },
];

const agentMenuItems = [
  { title: 'Overview', url: '/agent?tab=overview', icon: Home },
  { title: 'Patient Lookup', url: '/agent?tab=patient-lookup', icon: Search },
  { title: 'Assisted Patients', url: '/agent?tab=assisted-patients', icon: Users },
  { title: 'Transport Booking', url: '/agent?tab=transport-booking', icon: Map },
  { title: 'Appointment Booking', url: '/agent?tab=appointment-booking', icon: Calendar },
  { title: 'Chat Interface', url: '/agent?tab=chat', icon: MessageCircle },
];

const adminMenuItems = [
  { title: 'User Management', url: '/admin?tab=users', icon: Users },
  { title: 'System Analytics', url: '/admin?tab=analytics', icon: FileText },
  { title: 'Verification Center', url: '/admin?tab=verification', icon: Shield },
  { title: 'Document Management', url: '/admin?tab=documents', icon: FileText },
];

export const AppSidebar: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    if (!profile) return [];
    
    switch (profile.role) {
      case 'patient':
        return patientMenuItems;
      case 'physician':
        return physicianMenuItems;
      case 'hospital_admin':
        return hospitalMenuItems;
      case 'agent':
        return agentMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const isActiveLink = (itemUrl: string) => {
    const currentPath = location.pathname + location.search;
    const targetPath = itemUrl;
    
    // Check exact match first
    if (currentPath === targetPath) return true;
    
    // Check if the current search params match the item's tab
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(itemUrl.split('?')[1]);
    const currentTab = currentParams.get('tab');
    const targetTab = targetParams.get('tab');
    
    return currentTab === targetTab && location.pathname === itemUrl.split('?')[0];
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-center">
          <Logo size="lg" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {profile?.role === 'patient' && 'Patient Portal'}
            {profile?.role === 'physician' && 'Physician Portal'}
            {profile?.role === 'hospital_admin' && 'Hospital Management'}
            {profile?.role === 'agent' && 'Agent Dashboard'}
            {profile?.role === 'admin' && 'Admin Panel'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveLink(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
