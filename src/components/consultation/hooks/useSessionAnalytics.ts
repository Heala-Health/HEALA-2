
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

interface SessionMetrics {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageDuration: number;
  successRate: number;
}

interface SessionAnalytics {
  metrics: SessionMetrics;
  recentSessions: ConsultationSession[];
  loading: boolean;
  error: string | null;
}

export const useSessionAnalytics = (userId?: string, timeframe: 'day' | 'week' | 'month' = 'week') => {
  const [analytics, setAnalytics] = useState<SessionAnalytics>({
    metrics: {
      totalSessions: 0,
      completedSessions: 0,
      failedSessions: 0,
      averageDuration: 0,
      successRate: 0
    },
    recentSessions: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!userId) return;

    const fetchAnalytics = async () => {
      try {
        console.log('📊 [SessionAnalytics] Fetching analytics for user:', userId);
        
        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }

        // Fetch sessions data
        const { data: sessions, error } = await supabase
          .from('consultation_sessions')
          .select('*')
          .or(`patient_id.eq.${userId},physician_id.eq.${userId}`)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!sessions) {
          console.log('📊 [SessionAnalytics] No sessions found');
          setAnalytics(prev => ({ ...prev, loading: false }));
          return;
        }

        // Calculate metrics
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const failedSessions = sessions.filter(s => s.status === 'failed').length;
        
        const completedWithDuration = sessions.filter(s => 
          s.status === 'completed' && s.duration_minutes && s.duration_minutes > 0
        );
        
        const averageDuration = completedWithDuration.length > 0
          ? completedWithDuration.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedWithDuration.length
          : 0;

        const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

        const metrics: SessionMetrics = {
          totalSessions,
          completedSessions,
          failedSessions,
          averageDuration: Math.round(averageDuration),
          successRate: Math.round(successRate * 100) / 100
        };

        console.log('📊 [SessionAnalytics] Calculated metrics:', metrics);

        setAnalytics({
          metrics,
          recentSessions: sessions.slice(0, 10), // Last 10 sessions
          loading: false,
          error: null
        });

        // Log analytics event
        await logSessionAnalytics(userId, metrics);

      } catch (error) {
        console.error('❌ [SessionAnalytics] Error fetching analytics:', error);
        setAnalytics(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch analytics'
        }));
      }
    };

    fetchAnalytics();
  }, [userId, timeframe]);

  const logSessionAnalytics = async (userId: string, metrics: SessionMetrics) => {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          user_id: userId,
          metric_type: 'session_analytics',
          metric_value: metrics.successRate,
          recorded_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [SessionAnalytics] Error logging analytics:', error);
      } else {
        console.log('✅ [SessionAnalytics] Analytics logged successfully');
      }
    } catch (error) {
      console.error('❌ [SessionAnalytics] Exception logging analytics:', error);
    }
  };

  return analytics;
};
