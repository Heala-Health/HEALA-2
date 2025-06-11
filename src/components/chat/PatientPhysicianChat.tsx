
import React from 'react';
import { EnhancedPatientPhysicianChat } from '@/components/enhanced-chat/EnhancedPatientPhysicianChat';

interface PatientPhysicianChatProps {
  conversationId: string;
  onBack: () => void;
}

export const PatientPhysicianChat: React.FC<PatientPhysicianChatProps> = ({
  conversationId,
  onBack
}) => {
  return (
    <EnhancedPatientPhysicianChat 
      conversationId={conversationId} 
      onBack={onBack} 
    />
  );
};
