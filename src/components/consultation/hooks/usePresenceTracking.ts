import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPresence {
  user_id: string;
  status: 'online' | 'in_consultation' | 'offline';
  last_seen: string;
  session_id?: string;
}

interface PresenceTrackingProps {
  sessionId?: string;
  onPresenceUpdate?: (presence: Record<string, UserPresence[]>) => void;
}

export const usePresenceTracking = ({ 
  sessionId, 
  onPresenceUpdate 
}: PresenceTrackingProps = {}) => {
  const { user, profile } = useAuth();
  const [presenceState, setPresenceState] = useState<Record<string, UserPresence[]>>({});
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'in_consultation' | 'offline'>('offline');

  useEffect(() => {
    if (!user) return;

    const channelName = sessionId ? `presence_session_${sessionId}` : `presence_global_${user.id}`;
    console.log('🟢 [PresenceTracking] Setting up presence for channel:', channelName);

    const channel = supabase.channel(channelName);

    // Set up presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('🟢 [PresenceTracking] Presence sync:', newState);
        // Convert Supabase presence state to our UserPresence format
        const convertedState: Record<string, UserPresence[]> = {};
        Object.entries(newState).forEach(([key, presences]) => {
          convertedState[key] = presences.map(p => p as any as UserPresence);
        });
        setPresenceState(convertedState);
        onPresenceUpdate?.(convertedState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🟢 [PresenceTracking] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('🔴 [PresenceTracking] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          const userStatus: UserPresence = {
            user_id: user.id,
            status: sessionId ? 'in_consultation' : 'online',
            last_seen: new Date().toISOString(),
            session_id: sessionId
          };

          setCurrentUserStatus(userStatus.status);

          const presenceTrackStatus = await channel.track(userStatus);
          console.log('🟢 [PresenceTracking] Tracking status:', presenceTrackStatus);
        }
      });

    // Update status when entering/leaving consultation
    if (sessionId) {
      setCurrentUserStatus('in_consultation');
    } else {
      setCurrentUserStatus('online');
    }

    return () => {
      console.log('🧹 [PresenceTracking] Cleaning up presence tracking');
      channel.untrack();
      supabase.removeChannel(channel);
      setCurrentUserStatus('offline');
    };
  }, [user?.id, sessionId]);

  const updateStatus = async (status: 'online' | 'in_consultation' | 'offline') => {
    if (!user) return;

    const channelName = sessionId ? `presence_session_${sessionId}` : `presence_global_${user.id}`;
    const channel = supabase.channel(channelName);

    const userStatus: UserPresence = {
      user_id: user.id,
      status,
      last_seen: new Date().toISOString(),
      session_id: sessionId
    };

    await channel.track(userStatus);
    setCurrentUserStatus(status);
  };

  const getParticipantStatus = (userId: string): UserPresence | null => {
    for (const presences of Object.values(presenceState)) {
      const userPresence = presences.find(p => p.user_id === userId);
      if (userPresence) return userPresence;
    }
    return null;
  };

  const getOnlineParticipants = (): UserPresence[] => {
    const allPresences: UserPresence[] = [];
    for (const presences of Object.values(presenceState)) {
      allPresences.push(...presences.filter(p => p.status !== 'offline'));
    }
    return allPresences;
  };

  return {
    presenceState,
    currentUserStatus,
    updateStatus,
    getParticipantStatus,
    getOnlineParticipants
  };
};