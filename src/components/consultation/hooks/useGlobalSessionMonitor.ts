
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalSessionMonitorProps {
  isEnabled: boolean;
  onSessionStarted?: (sessionId: string) => void;
}

export const useGlobalSessionMonitor = ({ 
  isEnabled, 
  onSessionStarted 
}: GlobalSessionMonitorProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const channelRef = useRef<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isEnabled || !user || profile?.role !== 'patient') {
      console.log('🔕 [GlobalSessionMonitor] Disabled - isEnabled:', isEnabled, 'user:', !!user, 'role:', profile?.role);
      return;
    }

    console.log('🌍 [GlobalSessionMonitor] Setting up monitoring for patient:', user.id);

    // Fetch current state first
    fetchCurrentSessions();
    
    // Clean up existing channel
    if (channelRef.current) {
      console.log('🧹 [GlobalSessionMonitor] Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
    }

    // Set up real-time monitoring with specific patient filter
    console.log('📡 [GlobalSessionMonitor] Creating subscription channel for patient:', user.id);
    
    channelRef.current = supabase
      .channel(`global_sessions_${user.id}_${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'consultation_sessions',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🚨 [GlobalSessionMonitor] DATABASE UPDATE DETECTED:', {
            event: payload.eventType,
            oldStatus: payload.old?.status,
            newStatus: payload.new?.status,
            sessionId: payload.new?.id,
            timestamp: new Date().toISOString()
          });
          handleSessionUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 [GlobalSessionMonitor] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [GlobalSessionMonitor] Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [GlobalSessionMonitor] Channel subscription error');
        }
      });

    return () => {
      console.log('🧹 [GlobalSessionMonitor] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isEnabled, user, profile]);

  const fetchCurrentSessions = async () => {
    if (!user) return;
    
    try {
      console.log('📋 [GlobalSessionMonitor] Fetching current sessions for patient:', user.id);
      
      const { data: sessions, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [GlobalSessionMonitor] Error fetching sessions:', error);
        return;
      }

      console.log('📋 [GlobalSessionMonitor] Current sessions found:', sessions?.length || 0, sessions);
      setActiveSessions(sessions || []);
      setLastUpdate(new Date());
      
      // Check if any session is already in progress
      const inProgressSession = sessions?.find(s => s.status === 'in_progress');
      if (inProgressSession) {
        console.log('🎯 [GlobalSessionMonitor] Found session already in progress:', inProgressSession.id);
        showNotificationAndRedirect(inProgressSession);
      }
    } catch (error) {
      console.error('❌ [GlobalSessionMonitor] Error in fetchCurrentSessions:', error);
    }
  };

  const handleSessionUpdate = (payload: any) => {
    const newSession = payload.new;
    const oldSession = payload.old;
    
    console.log('🔄 [GlobalSessionMonitor] Processing session update:', {
      event: payload.eventType,
      sessionId: newSession?.id,
      oldStatus: oldSession?.status,
      newStatus: newSession?.status,
      patientId: newSession?.patient_id
    });
    
    // Update active sessions list
    if (payload.eventType === 'UPDATE' && newSession?.id) {
      setActiveSessions(prev => {
        const updated = prev.map(s => s.id === newSession.id ? newSession : s);
        console.log('📊 [GlobalSessionMonitor] Updated sessions list:', updated.length);
        return updated;
      });
      setLastUpdate(new Date());
    }
    
    // Check for status change to in_progress
    if (payload.eventType === 'UPDATE' && 
        oldSession?.status === 'scheduled' && 
        newSession?.status === 'in_progress') {
      
      console.log('🚨 [GlobalSessionMonitor] CONSULTATION STARTED! Session:', newSession.id);
      showNotificationAndRedirect(newSession);
      
      // Trigger callback
      if (onSessionStarted && newSession.id) {
        onSessionStarted(newSession.id);
      }
    }
  };

  const showNotificationAndRedirect = (session: any) => {
    console.log('🚀 [GlobalSessionMonitor] Showing notification and redirecting to session:', session.id);
    
    // Show immediate notification
    toast({
      title: "🚨 Doctor Started Consultation!",
      description: "Redirecting to video call now...",
      duration: 5000,
    });
    
    // Immediate redirect
    const redirectUrl = `/patient?tab=virtual-consultation&session=${session.id}`;
    console.log('🔀 [GlobalSessionMonitor] Redirecting to:', redirectUrl);
    navigate(redirectUrl);
  };

  const manualSessionCheck = async () => {
    console.log('🔍 [GlobalSessionMonitor] Manual session check triggered');
    await fetchCurrentSessions();
  };

  return {
    isMonitoring: isEnabled && !!channelRef.current,
    activeSessions,
    lastUpdate,
    manualSessionCheck
  };
};
