
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Video, Wifi, WifiOff, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConsultationSession } from './types';

interface SessionListProps {
  onSelectSession: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ onSelectSession }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchSessions();
      setupRealtimeUpdates();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      console.log('📋 [SessionList] Fetching consultation sessions for user:', user.id, 'role:', profile?.role);
      
      // First get the consultation sessions
      const sessionQuery = profile?.role === 'patient' 
        ? supabase.from('consultation_sessions').select('*').eq('patient_id', user.id)
        : supabase.from('consultation_sessions').select('*').eq('physician_id', user.id);

      const { data: sessionsData, error: sessionsError } = await sessionQuery
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('❌ [SessionList] Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      console.log('📋 [SessionList] Raw sessions data:', sessionsData);

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Get related profiles separately
      const sessionsWithProfiles = await Promise.all(
        sessionsData.map(async (session) => {
          const patientQuery = supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.patient_id)
            .single();

          const physicianQuery = supabase
            .from('profiles')
            .select('first_name, last_name, specialization')
            .eq('id', session.physician_id)
            .single();

          const [patientResult, physicianResult] = await Promise.all([
            patientQuery,
            physicianQuery
          ]);

          return {
            ...session,
            patient: patientResult.data,
            physician: physicianResult.data
          };
        })
      );

      console.log('📋 [SessionList] Sessions with profiles:', sessionsWithProfiles);
      setSessions(sessionsWithProfiles);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ [SessionList] Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation sessions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    if (!user) return;

    console.log('🔄 [SessionList] Setting up real-time updates for user:', user.id);

    const channel = supabase
      .channel(`session_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: profile?.role === 'patient' 
            ? `patient_id=eq.${user.id}`
            : `physician_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 [SessionList] Real-time session update:', payload);
          setIsConnected(true);
          
          // Refresh sessions data when changes occur
          fetchSessions();
          
          // Show toast for status changes
          if (payload.eventType === 'UPDATE') {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new?.status;
            
            if (oldStatus !== newStatus && newStatus === 'in_progress') {
              toast({
                title: "🚀 Session Started",
                description: profile?.role === 'patient' 
                  ? "Doctor has started the consultation!"
                  : "Consultation session is now active",
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 [SessionList] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🧹 [SessionList] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in_progress':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              In Progress
            </div>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getButtonText = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    
    // For patients - always show "Enter Video Call"
    if (!isPhysician) {
      return 'Enter Video Call';
    }
    
    // For physicians
    if (session.status === 'scheduled') {
      return 'Start Video Consultation';
    } else if (session.status === 'in_progress') {
      return 'Join Session';
    }
    return 'View Session';
  };

  const getButtonVariant = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    
    // For patients - always active variant
    if (!isPhysician) {
      return 'default' as const;
    }
    
    if (session.status === 'in_progress') {
      return 'default' as const; // Active look for in-progress sessions
    }
    return 'default' as const;
  };

  const isButtonDisabled = (session: ConsultationSession) => {
    // Never disable buttons for patients - they can always enter the video call
    if (profile?.role === 'patient') {
      return false;
    }
    
    // For physicians, no restrictions
    return false;
  };

  const getButtonIcon = () => {
    const isPhysician = profile?.role === 'physician';
    return isPhysician ? <Video className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />;
  };

  const getButtonStyle = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    
    // For patients - always show pulsing green button
    if (!isPhysician) {
      return {
        backgroundColor: '#16a34a',
        color: 'white',
        animation: 'pulse 2s infinite'
      };
    }
    
    // For physicians - pulse if in progress
    if (session.status === 'in_progress') {
      return {
        backgroundColor: '#2563eb',
        color: 'white',
        animation: 'pulse 2s infinite'
      };
    }
    
    return {};
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Available Consultation Sessions
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No consultation sessions available</p>
            <p className="text-sm">Virtual appointments will appear here once accepted by the physician.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 relative">
                {session.status === 'in_progress' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {profile?.role === 'patient' 
                            ? `Dr. ${session.physician?.first_name || 'Unknown'} ${session.physician?.last_name || ''}`
                            : `${session.patient?.first_name || 'Unknown'} ${session.patient?.last_name || ''}`
                          }
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                    
                    {session.physician?.specialization && profile?.role === 'patient' && (
                      <div className="text-sm text-gray-600 mb-2">
                        Specialization: {session.physician.specialization}
                      </div>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {new Date(session.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        Rate: ₦{session.consultation_rate.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log('🔘 [SessionList] Button clicked - selecting session:', session.id);
                        onSelectSession(session.id);
                      }}
                      variant={getButtonVariant(session)}
                      disabled={isButtonDisabled(session)}
                      style={getButtonStyle(session)}
                    >
                      {getButtonIcon()}
                      {getButtonText(session)}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
