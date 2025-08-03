
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';
import { useSessionLogger } from './useSessionLogger';
import { useSessionRecovery } from './useSessionRecovery';
import { fetchSessionData } from './sessionDataService';
import { startConsultationSession, endConsultationSession } from './sessionManagementService';

interface EnhancedSessionManagement {
  session: ConsultationSession | null;
  loading: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  sessionDuration: number;
  startSession: (userId: string) => Promise<ConsultationSession>;
  endSession: (userId: string) => Promise<ConsultationSession>;
  recoverSession: () => Promise<void>;
  formatDuration: (seconds: number) => string;
  healthStatus: 'healthy' | 'warning' | 'error';
}

export const useEnhancedSessionManagement = (sessionId: string | null): EnhancedSessionManagement => {
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  const { 
    logSessionStart,
    logSessionEnd,
    logSystemError,
    logRealtimeEvent,
    logConnectionIssue 
  } = useSessionLogger();

  const { recoverSession: performRecovery, checkSessionHealth } = useSessionRecovery();

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 [EnhancedSessionManagement] Loading session:', sessionId);
        
        const sessionData = await fetchSessionData(sessionId);
        setSession(sessionData);
        
        if (sessionData) {
          // Check session health
          const isHealthy = await checkSessionHealth(sessionId);
          setHealthStatus(isHealthy ? 'healthy' : 'warning');
        }
        
      } catch (error) {
        console.error('❌ [EnhancedSessionManagement] Error loading session:', error);
        setError(error instanceof Error ? error.message : 'Failed to load session');
        logSystemError(error instanceof Error ? error : new Error('Unknown error'), 'session_load', sessionId);
        setHealthStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Set up real-time monitoring with enhanced logging
  useEffect(() => {
    if (!sessionId) return;

    console.log('📡 [EnhancedSessionManagement] Setting up real-time monitoring');
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`enhanced_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📨 [EnhancedSessionManagement] Real-time session update:', payload);
          logRealtimeEvent(sessionId, payload.eventType, payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as any;
            setSession(prev => {
              if (!prev) return prev;
              
              return {
                ...prev,
                ...updatedSession,
                patient: prev.patient,
                physician: prev.physician
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [EnhancedSessionManagement] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          logConnectionIssue(sessionId, '', 'Real-time subscription failed');
        }
      });

    return () => {
      console.log('🧹 [EnhancedSessionManagement] Cleaning up real-time monitoring');
      supabase.removeChannel(channel);
      setConnectionStatus('disconnected');
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

  const startSession = useCallback(async (userId: string): Promise<ConsultationSession> => {
    if (!session) throw new Error('No session to start');
    if (!userId) throw new Error('User ID required to start session');
    
    try {
      console.log('🚀 [EnhancedSessionManagement] Starting session:', session.id);
      logSessionStart(session.id, userId, 'unknown');
      
      const updatedSession = await startConsultationSession(session, userId);
      setSession(updatedSession);
      setHealthStatus('healthy');
      
      return updatedSession;
    } catch (error) {
      console.error('❌ [EnhancedSessionManagement] Error starting session:', error);
      logSystemError(error instanceof Error ? error : new Error('Unknown error'), 'session_start', session.id, userId);
      setHealthStatus('error');
      throw error;
    }
  }, [session, logSessionStart, logSystemError]);

  const endSession = useCallback(async (userId: string): Promise<ConsultationSession> => {
    if (!session) throw new Error('No session to end');
    if (!userId) throw new Error('User ID required to end session');
    
    try {
      console.log('🏁 [EnhancedSessionManagement] Ending session:', session.id);
      
      const updatedSession = await endConsultationSession(session, userId);
      setSession(updatedSession);
      
      logSessionEnd(session.id, userId, updatedSession.duration_minutes || undefined);
      
      return updatedSession;
    } catch (error) {
      console.error('❌ [EnhancedSessionManagement] Error ending session:', error);
      logSystemError(error instanceof Error ? error : new Error('Unknown error'), 'session_end', session.id, userId);
      throw error;
    }
  }, [session, logSessionEnd, logSystemError]);

  const recoverSession = useCallback(async () => {
    if (!sessionId || !session) return;
    
    try {
      console.log('🔄 [EnhancedSessionManagement] Attempting session recovery');
      await performRecovery(sessionId, ''); // User ID will be handled in recovery hook
      
      // Reload session data after recovery
      const sessionData = await fetchSessionData(sessionId);
      setSession(sessionData);
      setHealthStatus('healthy');
      
    } catch (error) {
      console.error('❌ [EnhancedSessionManagement] Recovery failed:', error);
      setHealthStatus('error');
      throw error;
    }
  }, [sessionId, session, performRecovery]);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    session,
    loading,
    error,
    connectionStatus,
    sessionDuration,
    startSession,
    endSession,
    recoverSession,
    formatDuration,
    healthStatus
  };
};
