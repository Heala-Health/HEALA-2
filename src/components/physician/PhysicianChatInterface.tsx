
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { MessageCircle, Users, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkingAIBot } from '@/components/chat/WorkingAIBot';
import { usePhysicianChat } from './chat/hooks/usePhysicianChat';
import { ChatTabs } from './chat/ChatTabs';
import { PatientChatSection } from './chat/PatientChatSection';
import { PrescriptionSection } from './chat/PrescriptionSection';
import { Patient } from './chat/types';

export const PhysicianChatInterface: React.FC = () => {
  const { toast } = useToast();
  const { patients, conversations, loading, startNewConversation } = usePhysicianChat();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('patients');

  const handleStartConversation = async (patientId: string, patientName: string) => {
    try {
      const conversationId = await startNewConversation(patientId, patientName);
      if (conversationId) {
        setSelectedConversation(conversationId);
        
        toast({
          title: "Conversation Started",
          description: `New consultation started with ${patientName}`,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  const handlePrescriptionAdded = () => {
    toast({
      title: "Prescription Created",
      description: `Prescription created for ${selectedPatient?.first_name} ${selectedPatient?.last_name}`
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Physician Communication Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ChatTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <PatientChatSection
              patients={patients}
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              onStartConversation={handleStartConversation}
            />

            <PrescriptionSection
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
              onPrescriptionAdded={handlePrescriptionAdded}
            />

            <TabsContent value="physicians" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                Physician-to-physician chat coming soon
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <WorkingAIBot />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
