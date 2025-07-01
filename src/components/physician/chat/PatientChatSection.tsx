
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { ConversationList } from '@/components/chat/ConversationList';
import { PatientList } from '../PatientList';
import { PatientPhysicianChat } from '@/components/chat/PatientPhysicianChat';
import { Patient, Conversation } from './types';

interface PatientChatSectionProps {
  patients: Patient[];
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onStartConversation: (patientId: string, patientName: string) => void;
}

export const PatientChatSection: React.FC<PatientChatSectionProps> = ({
  patients,
  conversations,
  selectedConversation,
  onSelectConversation,
  onStartConversation
}) => {
  return (
    <TabsContent value="patients" className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <ConversationList 
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
          />
          <PatientList 
            patients={patients}
            onStartConversation={onStartConversation}
          />
        </div>

        <div className="lg:col-span-2">
          <PatientPhysicianChat 
            conversationId={selectedConversation || undefined} 
            onBack={() => onSelectConversation(null)}
          />
        </div>
      </div>
    </TabsContent>
  );
};
