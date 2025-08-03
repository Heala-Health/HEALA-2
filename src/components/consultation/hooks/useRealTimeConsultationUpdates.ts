import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConsultationSession } from '../types';

interface RealTimeConsultationUpdatesProps {
  onSessionStarted?: (session: ConsultationSession) => void;
  onSessionUpdated?: (session: ConsultationSession) => void;
  onPhysicianJoined?: (session: ConsultationSession) => void;
  onPatientJoined?: (session: ConsultationSession) => void;
}

export const useRealTimeConsultationUpdates = ({
  onSessionStarted,
  onSessionUpdated,
  onPhysicianJoined,
  onPatientJoined
}: RealTimeConsultationUpdatesProps = {}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<ConsultationSession[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    console.log('🔄 [RealTimeConsultationUpdates] Starting real-time monitoring for user:', user.id);
    setIsMonitoring(true);

    // Subscribe to consultation session changes for this user
    const channel = supabase
      .channel(`consultation_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: profile.role === 'patient' 
            ? `patient_id=eq.${user.id}` 
            : `physician_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('📨 [RealTimeConsultationUpdates] Session update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as ConsultationSession;
            
            // Create session with proper structure
            const sessionWithProfiles: ConsultationSession = {
              ...newSession,
              patient: null,
              physician: null
            };
            
            setActiveSessions(prev => [...prev, sessionWithProfiles]);
            onSessionStarted?.(sessionWithProfiles);
            
            toast({
              title: "New Consultation Session",
              description: "A new consultation session has been scheduled.",
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as ConsultationSession;
            
            setActiveSessions(prev => 
              prev.map(session => 
                session.id === updatedSession.id 
                  ? { ...session, ...updatedSession }
                  : session
              )
            );

            onSessionUpdated?.(updatedSession);

            // Handle status changes
            if (updatedSession.status === 'in_progress') {
              toast({
                title: "Consultation Started",
                description: "Your consultation session is now active. Navigate to virtual consultation to join.",
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_rooms',
          filter: `session_id=in.(${activeSessions.map(s => s.id).join(',')})`
        },
        (payload) => {
          console.log('📨 [RealTimeConsultationUpdates] Room update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const roomUpdate = payload.new as any;
            
            // Handle participant join events
            if (roomUpdate.physician_joined_at && !payload.old?.physician_joined_at) {
              onPhysicianJoined?.(activeSessions.find(s => s.id === roomUpdate.session_id)!);
              
              if (profile.role === 'patient') {
                toast({
                  title: "Physician Joined",
                  description: "Your physician has joined the consultation room.",
                });
              }
            }
            
            if (roomUpdate.patient_joined_at && !payload.old?.patient_joined_at) {
              onPatientJoined?.(activeSessions.find(s => s.id === roomUpdate.session_id)!);
              
              if (profile.role === 'physician') {
                toast({
                  title: "Patient Joined",
                  description: "Your patient has joined the consultation room.",
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [RealTimeConsultationUpdates] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          // Fetch current active sessions
          fetchCurrentSessions();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [RealTimeConsultationUpdates] Subscription error');
          setIsMonitoring(false);
        }
      });

    const fetchCurrentSessions = async () => {
      try {
        const { data: sessions } = await supabase
          .from('consultation_sessions')
          .select('*')
          .or(
            profile.role === 'patient' 
              ? `patient_id.eq.${user.id}` 
              : `physician_id.eq.${user.id}`
          )
          .in('status', ['scheduled', 'in_progress'])
          .order('created_at', { ascending: false });

        if (sessions) {
          const sessionsWithProfiles: ConsultationSession[] = sessions.map(session => ({
            ...session,
            patient: null,
            physician: null
          }));
          setActiveSessions(sessionsWithProfiles);
        }
      } catch (error) {
        console.error('❌ [RealTimeConsultationUpdates] Error fetching sessions:', error);
      }
    };

    return () => {
      console.log('🧹 [RealTimeConsultationUpdates] Cleaning up subscription');
      supabase.removeChannel(channel);
      setIsMonitoring(false);
    };
  }, [user?.id, profile?.role]);

  return {
    activeSessions,
    isMonitoring
  };
};