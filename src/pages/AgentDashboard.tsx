
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FixedPatientAssistance } from '@/components/agent/FixedPatientAssistance';
import { AgentChatInterface } from '@/components/agent/AgentChatInterface';
import { AppointmentBookingAgent } from '@/components/agent/AppointmentBooking';
import { AssistedPatients } from '@/components/agent/AssistedPatients';
import { DynamicOverview } from '@/components/agent/DynamicOverview';

const AgentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <DashboardLayout title="Agent Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {getWelcomeMessage()}, {profile?.first_name || 'Agent'}!
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Ready to assist patients with their healthcare needs
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Agent Portal
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="patient-assistance" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Assistance</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="assisted-patients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">My Patients</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="patient-assistance" className="mt-6">
            <FixedPatientAssistance />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <AgentChatInterface />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <AppointmentBookingAgent />
          </TabsContent>

          <TabsContent value="assisted-patients" className="mt-6">
            <AssistedPatients />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Agent settings and preferences will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
