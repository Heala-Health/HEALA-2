import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';
import { fetchSessionData } from './sessionDataService';
import { startConsultationSession, endConsultationSession } from './sessionManagementService';

export const useConsultationSession = (sessionId: string | null) => {
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Fetch session data when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        console.log('Loading session data for:', sessionId);
        setLoading(true);
        const sessionData = await fetchSessionData(sessionId);
        console.log('Session data loaded:', sessionData);
        setSession(sessionData);
      } catch (error) {
        console.error('Error loading session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Set up real-time listener for session changes
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time listener for session:', sessionId);

    const channel = supabase
      .channel(`consultation_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Real-time session update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as any;
            setSession(prev => {
              if (!prev) return prev;
              
              const newSession = {
                ...prev,
                ...updatedSession,
                // Keep the profile data from the previous state
                patient: prev.patient,
                physician: prev.physician
              };
              
              console.log('Updated session state:', newSession);
              return newSession;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      console.log('Cleaning up real-time listener');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Update session duration for active sessions
  useEffect(() => {
    if (!session || session.status !== 'in_progress' || !session.started_at) {
      setSessionDuration(0);
      return;
    }

    const startTime = new Date(session.started_at).getTime();
    
    const updateDuration = () => {
      const now = new Date().getTime();
      const duration = Math.floor((now - startTime) / 1000);
      setSessionDuration(duration);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [session?.started_at, session?.status]);

  const startSession = async () => {
    if (!session) throw new Error('No session to start');
    
    try {
      console.log('Starting consultation session:', session.id);
      const updatedSession = await startConsultationSession(session);
      setSession(updatedSession);
      return updatedSession;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  };

  const endSession = async () => {
    if (!session) throw new Error('No session to end');
    
    try {
      console.log('Ending consultation session:', session.id);
      const updatedSession = await endConsultationSession(session);
      setSession(updatedSession);
      return updatedSession;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    session,
    loading,
    sessionDuration,
    connectionStatus,
    startSession,
    endSession,
    formatDuration
  };
};
