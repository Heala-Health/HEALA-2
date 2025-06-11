
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RealtimeContextType {
  isConnected: boolean;
  connectionCount: number;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  connectionCount: 0
});

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Set up emergency notifications channel
    const emergencyChannel = supabase
      .channel('emergency-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambulance_requests'
        },
        (payload) => {
          const request = payload.new as any;
          toast({
            title: "🚨 Emergency Request",
            description: `New ${request.emergency_type} request from ${request.pickup_address}`,
            variant: "destructive"
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = emergencyChannel.presenceState();
        setConnectionCount(Object.keys(newState).length);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Set up chat notifications if user is a physician
    let chatChannel: any = null;
    if (user) {
      chatChannel = supabase
        .channel('chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const message = payload.new as any;
            if (message.sender_id !== user.id) {
              toast({
                title: "💬 New Message",
                description: "You have a new message in your chat",
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(emergencyChannel);
      if (chatChannel) {
        supabase.removeChannel(chatChannel);
      }
    };
  }, [user, toast]);

  const value = {
    isConnected,
    connectionCount
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
