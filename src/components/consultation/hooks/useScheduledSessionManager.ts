import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConsultationSession } from '../types';
import { useToast } from '@/hooks/use-toast';

interface ScheduledSessionManagerProps {
  onSessionReady?: (session: ConsultationSession) => void;
  onSessionExpired?: (session: ConsultationSession) => void;
}

export const useScheduledSessionManager = ({
  onSessionReady,
  onSessionExpired
}: ScheduledSessionManagerProps = {}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<ConsultationSession[]>([]);
  const [readySessions, setReadySessions] = useState<ConsultationSession[]>([]);

  const isSessionReady = useCallback((session: ConsultationSession): boolean => {
    if (!session.appointment_id) return true; // Sessions without appointments are always ready
    
    // Get the appointment time from the session creation or a scheduled time
    const sessionTime = new Date(session.created_at);
    const now = new Date();
    
    // Session is ready 10 minutes before scheduled time
    const readyTime = new Date(sessionTime.getTime() - 10 * 60 * 1000);
    
    return now >= readyTime;
  }, []);

  const isSessionExpired = useCallback((session: ConsultationSession): boolean => {
    if (session.status === 'completed' || session.ended_at) return true;
    
    const sessionTime = new Date(session.created_at);
    const now = new Date();
    
    // Session expires 1 hour after scheduled time if not started
    const expireTime = new Date(sessionTime.getTime() + 60 * 60 * 1000);
    
    return now > expireTime && session.status === 'scheduled';
  }, []);

  const fetchScheduledSessions = useCallback(async () => {
    if (!user || !profile) return;

    try {
        const { data: sessions } = await supabase
          .from('consultation_sessions')
          .select('*')
          .or(
            profile.role === 'patient' 
              ? `patient_id.eq.${user.id}` 
              : `physician_id.eq.${user.id}`
          )
          .eq('status', 'scheduled')
          .order('created_at', { ascending: true });

      if (sessions) {
        const upcoming: ConsultationSession[] = [];
        const ready: ConsultationSession[] = [];

        sessions.forEach(rawSession => {
          const session: ConsultationSession = {
            ...rawSession,
            patient: null,
            physician: null
          };
          
          if (isSessionExpired(session)) {
            // Mark expired sessions
            supabase
              .from('consultation_sessions')
              .update({ status: 'expired' })
              .eq('id', session.id);
            
            onSessionExpired?.(session);
          } else if (isSessionReady(session)) {
            ready.push(session);
            onSessionReady?.(session);
          } else {
            upcoming.push(session);
          }
        });

        setUpcomingSessions(upcoming);
        setReadySessions(ready);
      }
    } catch (error) {
      console.error('❌ [ScheduledSessionManager] Error fetching sessions:', error);
    }
  }, [user?.id, profile?.role, isSessionReady, isSessionExpired, onSessionReady, onSessionExpired]);

  const checkSessionAvailability = useCallback((sessionId: string): 'not_ready' | 'ready' | 'expired' | 'not_found' => {
    const allSessions = [...upcomingSessions, ...readySessions];
    const session = allSessions.find(s => s.id === sessionId);
    
    if (!session) return 'not_found';
    if (isSessionExpired(session)) return 'expired';
    if (isSessionReady(session)) return 'ready';
    
    return 'not_ready';
  }, [upcomingSessions, readySessions, isSessionReady, isSessionExpired]);

  const getSessionTimeUntilReady = useCallback((sessionId: string): number => {
    const session = upcomingSessions.find(s => s.id === sessionId);
    if (!session) return 0;
    
    const sessionTime = new Date(session.created_at);
    const readyTime = new Date(sessionTime.getTime() - 10 * 60 * 1000);
    const now = new Date();
    
    return Math.max(0, readyTime.getTime() - now.getTime());
  }, [upcomingSessions]);

  const sendReminder = useCallback(async (sessionId: string) => {
    const session = [...upcomingSessions, ...readySessions].find(s => s.id === sessionId);
    if (!session) return;

    try {
      toast({
        title: "Consultation Reminder",
        description: profile?.role === 'patient' 
          ? `Your consultation with Dr. ${session.physician?.first_name} ${session.physician?.last_name} is starting soon.`
          : `Your consultation with ${session.patient?.first_name} ${session.patient?.last_name} is starting soon.`,
        duration: 10000,
      });
    } catch (error) {
      console.error('❌ [ScheduledSessionManager] Error sending reminder:', error);
    }
  }, [upcomingSessions, readySessions, profile?.role, toast]);

  // Periodic check for session readiness
  useEffect(() => {
    fetchScheduledSessions();
    
    const interval = setInterval(() => {
      fetchScheduledSessions();
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchScheduledSessions]);

  // Send reminders for sessions starting in 5 minutes
  useEffect(() => {
    const checkForReminders = () => {
      upcomingSessions.forEach(session => {
        const timeUntilReady = getSessionTimeUntilReady(session.id);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilReady <= fiveMinutes && timeUntilReady > 0) {
          sendReminder(session.id);
        }
      });
    };

    const reminderInterval = setInterval(checkForReminders, 60 * 1000); // Check every minute
    
    return () => clearInterval(reminderInterval);
  }, [upcomingSessions, getSessionTimeUntilReady, sendReminder]);

  return {
    upcomingSessions,
    readySessions,
    checkSessionAvailability,
    getSessionTimeUntilReady,
    sendReminder,
    refreshSessions: fetchScheduledSessions
  };
};