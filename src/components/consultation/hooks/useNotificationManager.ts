
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationManagerProps } from './notificationTypes';
import { useEventProcessor } from './eventProcessor';

export const useNotificationManager = ({
  sessionId,
  userId,
  isPatient,
  isPhysician,
  onConsultationStarted,
  onPatientJoined
}: NotificationManagerProps) => {
  const channelsRef = useRef<any[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  const {
    handleDatabaseChange,
    handleConsultationStartedBroadcast,
    handlePatientJoinedBroadcast
  } = useEventProcessor(
    userId,
    isPatient,
    isPhysician,
    onConsultationStarted,
    onPatientJoined,
    processedEventsRef
  );

  useEffect(() => {
    if (!userId || !sessionId) {
      console.log('⚠️ [NotificationManager] Missing userId or sessionId, skipping setup');
      return;
    }

    console.log('🔔 [NotificationManager] Setting up notifications for:', { 
      sessionId, 
      userId, 
      role: isPatient ? 'patient' : 'physician' 
    });

    // Clean up any existing channels first
    cleanup();

    // Set up database change listener - PRIMARY notification method
    const dbChannel = supabase
      .channel(`consultation_db_${sessionId}_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📡 [NotificationManager] Database change detected:', payload);
          handleDatabaseChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 [NotificationManager] Database subscription status:', status);
      });

    // Set up broadcast listener - BACKUP notification method
    const broadcastChannel = supabase
      .channel(`consultation_broadcast_${sessionId}_${userId}`)
      .on('broadcast', { event: 'consultation-started' }, (broadcastEvent) => {
        console.log('📢 [NotificationManager] Consultation-started broadcast received:', broadcastEvent);
        // Transform the broadcast event to match our expected payload structure
        const transformedPayload = {
          payload: broadcastEvent.payload || {}
        };
        handleConsultationStartedBroadcast(transformedPayload);
      })
      .on('broadcast', { event: 'patient-joined' }, (broadcastEvent) => {
        console.log('📢 [NotificationManager] Patient-joined broadcast received:', broadcastEvent);
        // Transform the broadcast event to match our expected payload structure
        const transformedPayload = {
          payload: broadcastEvent.payload || {}
        };
        handlePatientJoinedBroadcast(transformedPayload);
      })
      .subscribe((status) => {
        console.log('📢 [NotificationManager] Broadcast subscription status:', status);
      });

    // Store channels for cleanup
    channelsRef.current = [dbChannel, broadcastChannel];

    return cleanup;
  }, [sessionId, userId, isPatient, isPhysician]);

  const cleanup = () => {
    console.log('🧹 [NotificationManager] Cleaning up channels');
    channelsRef.current.forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    channelsRef.current = [];
    processedEventsRef.current.clear();
  };

  return { cleanup };
};

// Re-export the broadcast service functions for backward compatibility
export { sendConsultationStarted, sendPatientJoined } from './broadcastService';
