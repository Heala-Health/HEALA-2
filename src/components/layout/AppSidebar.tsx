
import React from 'react';
import { Calendar, MessageCircle, Bot, Users, Phone, FileText, Settings, Pill, Heart, Search, Shield, Wifi, Map, Home, Wallet, Video, Headphones, CreditCard, Activity, AlertTriangle, DollarSign, FileCheck, Monitor, Siren, Building, TrendingUp, BarChart3, Bell, Clipboard, UserCheck, Package, Cog } from 'lucide-react';
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
  { title: 'Wallet', url: '/patient?tab=wallet', icon: Wallet },
  { title: 'Virtual Consultation', url: '/patient?tab=virtual-consultation', icon: Video },
  { title: 'Chat', url: '/patient?tab=chat', icon: MessageCircle },
  { title: 'AI Assistant', url: '/patient?tab=ai-assistant', icon: Bot },
  { title: 'Prescriptions', url: '/patient?tab=prescriptions', icon: Pill },
  { title: 'Health Records', url: '/patient?tab=health-records', icon: FileText },
  { title: 'Symptom Checker', url: '/patient?tab=symptom-checker', icon: Search },
  { title: 'Emergency Contacts', url: '/patient?tab=emergency-contacts', icon: Phone },
  { title: 'Contact Agent', url: '/patient?tab=contact-agent', icon: Headphones },
  { title: 'Physician', url: '/patient?tab=physician', icon: Users },
  { title: 'Emergency', url: '/patient?tab=emergency', icon: Heart },
  { title: 'Transport', url: '/patient?tab=transport', icon: Map },
  { title: 'Profile', url: '/patient?tab=profile', icon: Users },
  { title: 'Accessibility', url: '/patient?tab=accessibility', icon: Shield },
  { title: 'Offline Access', url: '/patient?tab=offline', icon: Wifi },
  { title: 'Subscription', url: '/patient?tab=subscription', icon: CreditCard },
  { title: 'Settings', url: '/patient?tab=settings', icon: Settings },
];

const physicianMenuItems = [
  { title: 'Overview', url: '/physician?tab=overview', icon: Home },
  { title: 'Appointments', url: '/physician?tab=appointments', icon: Calendar },
  { title: 'Patients', url: '/physician?tab=patients', icon: Users },
  { title: 'Chat', url: '/physician?tab=chat', icon: MessageCircle },
  { title: 'Wallet', url: '/physician?tab=wallet', icon: Wallet },
  { title: 'Virtual Consultation', url: '/physician?tab=virtual-consultation', icon: Video },
  { title: 'Profile', url: '/physician?tab=profile', icon: Users },
  { title: 'Documents', url: '/physician?tab=documents', icon: FileText },
];

const hospitalMenuItems = [
  { title: 'Overview', url: '/hospital?tab=overview', icon: TrendingUp },
  { title: 'Physicians', url: '/hospital?tab=physicians', icon: Users },
  { title: 'Appointments', url: '/hospital?tab=appointments', icon: Calendar },
  { title: 'Patients', url: '/hospital?tab=patients', icon: Heart },
  { title: 'Emergency', url: '/hospital?tab=emergency', icon: AlertTriangle },
  { title: 'Financial', url: '/hospital?tab=financial', icon: DollarSign },
  { title: 'Security', url: '/hospital?tab=security', icon: Shield },
  { title: 'Compliance', url: '/hospital?tab=compliance', icon: FileCheck },
  { title: 'Analytics', url: '/hospital?tab=analytics', icon: BarChart3 },
  { title: 'Operations', url: '/hospital?tab=operations', icon: Activity },
  { title: 'Notifications', url: '/hospital?tab=notifications', icon: Bell },
  { title: 'Resources', url: '/hospital?tab=resources', icon: Package },
  { title: 'Settings', url: '/hospital?tab=settings', icon: Settings },
];

const agentMenuItems = [
  { title: 'Overview', url: '/agent?tab=overview', icon: Home },
  { title: 'Patient Lookup', url: '/agent?tab=patient-lookup', icon: Search },
  { title: 'Assisted Patients', url: '/agent?tab=assisted-patients', icon: Users },
  { title: 'Transport Booking', url: '/agent?tab=transport-booking', icon: Map },
  { title: 'Appointment Booking', url: '/agent?tab=appointment-booking', icon: Calendar },
  { title: 'Chat Interface', url: '/agent?tab=chat', icon: MessageCircle },
  { title: 'Settings & Preferences', url: '/agent?tab=settings', icon: Cog },
];

const adminMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: Home },
  { title: 'User Management', url: '/admin?tab=users', icon: Users },
  { title: 'Verification Center', url: '/admin?tab=verifications', icon: FileCheck },
  { title: 'Real-time Monitor', url: '/admin?tab=monitoring', icon: Monitor },
  { title: 'User Activity', url: '/admin?tab=activity', icon: Activity },
  { title: 'Emergency Center', url: '/admin?tab=emergency', icon: Siren },
  { title: 'Financial Disputes', url: '/admin?tab=financial', icon: DollarSign },
  { title: 'Compliance Reports', url: '/admin?tab=compliance', icon: FileText },
  { title: 'System Settings', url: '/admin?tab=settings', icon: Settings },
  { title: 'Audit Log', url: '/admin?tab=audit', icon: Shield },
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
    
    // For admin dashboard, check if we're on the admin page without tab (dashboard)
    if (itemUrl === '/admin' && location.pathname === '/admin' && !location.search) {
      return true;
    }
    
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
