
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogCategory = 'session_lifecycle' | 'video_call' | 'realtime' | 'user_action' | 'system_error';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const useSessionLogger = () => {
  const log = useCallback(async (entry: Omit<LogEntry, 'timestamp'>) => {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = { ...entry, timestamp };

    // Console logging with emoji prefixes
    const emoji = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    const prefix = `${emoji[entry.level]} [SessionLogger][${entry.category}]`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.metadata);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case 'debug':
        console.debug(prefix, entry.message, entry.metadata);
        break;
      default:
        console.log(prefix, entry.message, entry.metadata);
    }

    // Store critical logs in database
    if (entry.level === 'error' || entry.category === 'session_lifecycle') {
      try {
        const { error } = await supabase
          .from('performance_metrics')
          .insert({
            user_id: entry.userId || null,
            metric_type: `log_${entry.category}`,
            metric_value: entry.level === 'error' ? 0 : 1,
            recorded_at: timestamp
          });

        if (error) {
          console.error('❌ [SessionLogger] Failed to store log:', error);
        }
      } catch (error) {
        console.error('❌ [SessionLogger] Exception storing log:', error);
      }
    }
  }, []);

  // Convenience methods
  const logInfo = useCallback((category: LogCategory, message: string, metadata?: Record<string, any>, sessionId?: string, userId?: string) => {
    log({ level: 'info', category, message, metadata, sessionId, userId });
  }, [log]);

  const logWarn = useCallback((category: LogCategory, message: string, metadata?: Record<string, any>, sessionId?: string, userId?: string) => {
    log({ level: 'warn', category, message, metadata, sessionId, userId });
  }, [log]);

  const logError = useCallback((category: LogCategory, message: string, metadata?: Record<string, any>, sessionId?: string, userId?: string) => {
    log({ level: 'error', category, message, metadata, sessionId, userId });
  }, [log]);

  const logDebug = useCallback((category: LogCategory, message: string, metadata?: Record<string, any>, sessionId?: string, userId?: string) => {
    log({ level: 'debug', category, message, metadata, sessionId, userId });
  }, [log]);

  // Session-specific logging methods
  const logSessionStart = useCallback((sessionId: string, userId: string, userRole: string) => {
    logInfo('session_lifecycle', `Session started by ${userRole}`, { userRole }, sessionId, userId);
  }, [logInfo]);

  const logSessionEnd = useCallback((sessionId: string, userId: string, duration?: number) => {
    logInfo('session_lifecycle', 'Session ended', { duration }, sessionId, userId);
  }, [logInfo]);

  const logVideoCallStart = useCallback((sessionId: string, userId: string) => {
    logInfo('video_call', 'Video call started', {}, sessionId, userId);
  }, [logInfo]);

  const logVideoCallEnd = useCallback((sessionId: string, userId: string, reason?: string) => {
    logInfo('video_call', 'Video call ended', { reason }, sessionId, userId);
  }, [logInfo]);

  const logConnectionIssue = useCallback((sessionId: string, userId: string, issue: string) => {
    logWarn('video_call', `Connection issue: ${issue}`, { issue }, sessionId, userId);
  }, [logWarn]);

  const logRealtimeEvent = useCallback((sessionId: string, event: string, payload?: any) => {
    logDebug('realtime', `Realtime event: ${event}`, { event, payload }, sessionId);
  }, [logDebug]);

  const logUserAction = useCallback((sessionId: string, userId: string, action: string, metadata?: Record<string, any>) => {
    logInfo('user_action', `User action: ${action}`, { action, ...metadata }, sessionId, userId);
  }, [logInfo]);

  const logSystemError = useCallback((error: Error, context?: string, sessionId?: string, userId?: string) => {
    logError('system_error', `System error: ${error.message}`, { 
      error: error.message, 
      stack: error.stack, 
      context 
    }, sessionId, userId);
  }, [logError]);

  return {
    log,
    logInfo,
    logWarn,
    logError,
    logDebug,
    logSessionStart,
    logSessionEnd,
    logVideoCallStart,
    logVideoCallEnd,
    logConnectionIssue,
    logRealtimeEvent,
    logUserAction,
    logSystemError
  };
};
