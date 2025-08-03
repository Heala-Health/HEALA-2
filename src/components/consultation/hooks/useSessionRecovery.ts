
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';
import { useToast } from '@/hooks/use-toast';

interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRecover?: boolean;
}

export const useSessionRecovery = (options: RecoveryOptions = {}) => {
  const { maxRetries = 3, retryDelay = 2000, autoRecover = true } = options;
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const recoverSession = useCallback(async (sessionId: string, userId: string): Promise<ConsultationSession | null> => {
    console.log('🔄 [SessionRecovery] Starting session recovery:', { sessionId, userId, attempt: recoveryAttempts + 1 });
    
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);

    try {
      // Step 1: Check if session exists and get current state
      const { data: session, error: fetchError } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ [SessionRecovery] Session not found:', fetchError);
        throw new Error('Session not found');
      }

      if (!session) {
        throw new Error('Session data is null');
      }

      console.log('📋 [SessionRecovery] Current session state:', session.status);

      // Step 2: Check if consultation room exists
      const { data: room, error: roomError } = await supabase
        .from('consultation_rooms')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        console.error('❌ [SessionRecovery] Room fetch error:', roomError);
      }

      // Step 3: Recovery based on session state
      let recoveredSession = session;

      if (session.status === 'in_progress' && !room) {
        // Create missing consultation room
        console.log('🏗️ [SessionRecovery] Creating missing consultation room');
        
        const { error: roomCreateError } = await supabase
          .from('consultation_rooms')
          .insert({
            session_id: sessionId,
            room_token: `room_${sessionId}`,
            room_status: 'active'
          });

        if (roomCreateError) {
          console.error('❌ [SessionRecovery] Failed to create room:', roomCreateError);
        } else {
          console.log('✅ [SessionRecovery] Consultation room created');
        }
      }

      if (session.status === 'scheduled' && session.session_type === 'video') {
        // Ensure room exists for scheduled video sessions
        if (!room) {
          console.log('🏗️ [SessionRecovery] Creating room for scheduled session');
          
          const { error: roomCreateError } = await supabase
            .from('consultation_rooms')
            .insert({
              session_id: sessionId,
              room_token: `room_${sessionId}`,
              room_status: 'waiting'
            });

          if (roomCreateError) {
            console.error('❌ [SessionRecovery] Failed to create room:', roomCreateError);
          }
        }
      }

      // Step 4: Log recovery event
      const { error: logError } = await supabase
        .from('performance_metrics')
        .insert({
          user_id: userId,
          metric_type: 'session_recovery',
          metric_value: 1,
          recorded_at: new Date().toISOString()
        });

      if (logError) {
        console.error('❌ [SessionRecovery] Failed to log recovery:', logError);
      }

      console.log('✅ [SessionRecovery] Session recovery completed');
      
      toast({
        title: "🔄 Session Recovered",
        description: "Connection has been restored successfully",
      });

      setIsRecovering(false);
      setRecoveryAttempts(0);
      
      return recoveredSession;

    } catch (error) {
      console.error('❌ [SessionRecovery] Recovery failed:', error);
      
      if (recoveryAttempts < maxRetries) {
        console.log(`🔄 [SessionRecovery] Retrying in ${retryDelay}ms (${recoveryAttempts + 1}/${maxRetries})`);
        
        setTimeout(() => {
          recoverSession(sessionId, userId);
        }, retryDelay);
        
        return null;
      } else {
        console.error('💥 [SessionRecovery] Max recovery attempts reached');
        
        toast({
          title: "❌ Recovery Failed",
          description: "Unable to recover session after multiple attempts",
          variant: "destructive"
        });
        
        setIsRecovering(false);
        setRecoveryAttempts(0);
        
        throw error;
      }
    }
  }, [recoveryAttempts, maxRetries, retryDelay, toast]);

  const checkSessionHealth = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      console.log('🔍 [SessionRecovery] Checking session health:', sessionId);
      
      const { data: session, error } = await supabase
        .from('consultation_sessions')
        .select('status, session_type')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.log('⚠️ [SessionRecovery] Session health check failed');
        return false;
      }

      // Check if video session has consultation room
      if (session.session_type === 'video' && session.status !== 'completed') {
        const { data: room, error: roomError } = await supabase
          .from('consultation_rooms')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (roomError || !room) {
          console.log('⚠️ [SessionRecovery] Video session missing consultation room');
          return false;
        }
      }

      console.log('✅ [SessionRecovery] Session health check passed');
      return true;
    } catch (error) {
      console.error('❌ [SessionRecovery] Health check error:', error);
      return false;
    }
  }, []);

  return {
    recoverSession,
    checkSessionHealth,
    isRecovering,
    recoveryAttempts
  };
};
