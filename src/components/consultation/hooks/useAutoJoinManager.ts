
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoJoinManagerProps {
  sessionId: string;
  userId: string;
  profile: any;
  isPatient: boolean;
  initiateCall: (callerName: string) => void;
  sendPatientJoined: (sessionId: string, patientId: string) => Promise<void>;
}

export const useAutoJoinManager = ({
  sessionId,
  userId,
  profile,
  isPatient,
  initiateCall,
  sendPatientJoined
}: AutoJoinManagerProps) => {
  const { toast } = useToast();
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const autoJoinTimeoutRef = useRef<NodeJS.Timeout>();

  const triggerAutoJoin = async () => {
    if (autoJoinAttempted) {
      console.log('⚠️ [AutoJoinManager] Auto-join already attempted, skipping');
      return;
    }

    if (!isPatient) {
      console.log('⚠️ [AutoJoinManager] Not a patient, skipping auto-join');
      return;
    }

    try {
      console.log('🚀 [AutoJoinManager] Starting auto-join process for session:', sessionId);
      setAutoJoinAttempted(true);
      setShowJoinButton(false);
      
      // Notify physician that patient is joining
      await sendPatientJoined(sessionId, userId);
      
      // Show joining message
      toast({
        title: "🎥 Joining Video Call",
        description: "Connecting to the consultation...",
        duration: 6000,
      });
      
      // Start the video call after a short delay
      const callerName = `${profile?.first_name || 'Patient'} ${profile?.last_name || ''}`.trim();
      
      autoJoinTimeoutRef.current = setTimeout(() => {
        console.log('📞 [AutoJoinManager] Initiating video call for patient:', callerName);
        initiateCall(callerName);
      }, 1500);
      
    } catch (error) {
      console.error('❌ [AutoJoinManager] Error during auto-join:', error);
      setAutoJoinAttempted(false);
      setShowJoinButton(true);
      
      toast({
        title: "Error",
        description: "Failed to join consultation automatically. Please try joining manually.",
        variant: "destructive"
      });
    }
  };

  const triggerManualJoin = async () => {
    try {
      console.log('👤 [AutoJoinManager] Manual join triggered for session:', sessionId);
      
      // Notify physician that patient is joining
      await sendPatientJoined(sessionId, userId);
      
      setShowJoinButton(false);
      setAutoJoinAttempted(true);
      
      // Start the video call
      const callerName = `${profile?.first_name || 'Patient'} ${profile?.last_name || ''}`.trim();
      initiateCall(callerName);
      
      toast({
        title: "🎥 Joining Consultation",
        description: "Connecting to video call...",
      });
    } catch (error) {
      console.error('❌ [AutoJoinManager] Error during manual join:', error);
      toast({
        title: "Error",
        description: "Failed to join consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetAutoJoin = () => {
    console.log('🔄 [AutoJoinManager] Resetting auto-join state');
    setAutoJoinAttempted(false);
    setShowJoinButton(false);
    if (autoJoinTimeoutRef.current) {
      clearTimeout(autoJoinTimeoutRef.current);
    }
  };

  const enableManualJoin = () => {
    console.log('🔘 [AutoJoinManager] Enabling manual join button');
    setShowJoinButton(true);
  };

  return {
    autoJoinAttempted,
    showJoinButton,
    triggerAutoJoin,
    triggerManualJoin,
    resetAutoJoin,
    enableManualJoin
  };
};
