
import { useToast } from '@/hooks/use-toast';
import { DatabaseChangePayload, BroadcastPayload } from './notificationTypes';

export const useEventProcessor = (
  userId: string,
  isPatient: boolean,
  isPhysician: boolean,
  onConsultationStarted: () => void,
  onPatientJoined: () => void,
  processedEventsRef: React.MutableRefObject<Set<string>>
) => {
  const { toast } = useToast();

  const handleDatabaseChange = (payload: DatabaseChangePayload) => {
    const newSession = payload.new as any;
    const oldSession = payload.old as any;
    
    // Create unique event ID to prevent duplicates
    const eventId = `db_change_${newSession.id}_${newSession.status}_${newSession.updated_at}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    // Check if status changed from scheduled to in_progress
    if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
      console.log('🚀 [NotificationManager] Consultation started via database update!');
      
      if (isPatient) {
        toast({
          title: "🚨 Doctor Started Consultation!",
          description: "You can now join the video call",
          duration: 8000,
        });
        
        // Trigger the consultation started handler with delay
        setTimeout(() => {
          onConsultationStarted();
        }, 500);
      }
    }
  };

  const handleConsultationStartedBroadcast = (payload: BroadcastPayload) => {
    const data = payload.payload;
    const eventId = `broadcast_started_${data?.sessionId}_${data?.timestamp}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Broadcast event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    if (data?.startedBy !== userId && isPatient) {
      console.log('🎯 [NotificationManager] Patient receiving consultation start notification via broadcast');
      
      toast({
        title: "🚨 Doctor Started Consultation!",
        description: "You can now join the video call",
        duration: 8000,
      });
      
      setTimeout(() => {
        onConsultationStarted();
      }, 500);
    }
  };

  const handlePatientJoinedBroadcast = (payload: BroadcastPayload) => {
    const data = payload.payload;
    const eventId = `broadcast_joined_${data?.patientId}_${data?.timestamp}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Patient joined event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    if (data?.patientId !== userId && isPhysician) {
      console.log('👨‍⚕️ [NotificationManager] Physician notified of patient joining via broadcast');
      onPatientJoined();
    }
  };

  return {
    handleDatabaseChange,
    handleConsultationStartedBroadcast,
    handlePatientJoinedBroadcast
  };
};
