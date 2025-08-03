
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserSessions } from './hooks/sessionDataService';
import { Video, MessageCircle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface SessionListProps {
  onSelectSession: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ onSelectSession }) => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  useEffect(() => {
    if (!user?.id || !profile?.role) return;

    const loadSessions = async () => {
      try {
        console.log('📋 [SessionList] Fetching consultation sessions for user:', user.id, 'role:', profile.role);
        setLoading(true);
        setError(null);

        const userSessions = await fetchUserSessions(user.id, profile.role as 'patient' | 'physician');
        
        // Enrich sessions with profile data
        const enrichedSessions = await Promise.all(
          userSessions.map(async (session) => {
            const [patientResult, physicianResult] = await Promise.allSettled([
              supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', session.patient_id)
                .single(),
              supabase
                .from('profiles')
                .select('first_name, last_name, specialization')
                .eq('id', session.physician_id)
                .single()
            ]);

            return {
              ...session,
              patient: patientResult.status === 'fulfilled' && patientResult.value.data 
                ? patientResult.value.data 
                : { first_name: 'Unknown', last_name: 'Patient' },
              physician: physicianResult.status === 'fulfilled' && physicianResult.value.data 
                ? physicianResult.value.data 
                : { first_name: 'Unknown', last_name: 'Doctor', specialization: 'General Practice' }
            };
          })
        );

        console.log('📋 [SessionList] Sessions with profiles:', enrichedSessions);
        setSessions(enrichedSessions);
      } catch (err) {
        console.error('❌ [SessionList] Error loading sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();

    // Set up real-time updates
    console.log('🔄 [SessionList] Setting up real-time updates for user:', user.id);
    const channel = supabase
      .channel(`sessions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions',
          filter: isPhysician ? `physician_id=eq.${user.id}` : `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 [SessionList] Real-time session update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Reload sessions to get the new one with profile data
            loadSessions();
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as any;
            setSessions(prev => 
              prev.map(session => 
                session.id === updatedSession.id 
                  ? { ...session, ...updatedSession }
                  : session
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 [SessionList] Subscription status:', status);
      });

    return () => {
      console.log('🧹 [SessionList] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role, isPhysician]);

  const getSessionIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSessionTypeLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'video':
        return 'Video Call';
      case 'chat':
        return 'Chat Session';
      default:
        return 'Session';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading your consultation sessions...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading sessions: {error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Your Consultation Sessions ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <Calendar className="w-12 h-12 mx-auto text-gray-300" />
            </div>
            <p className="text-lg font-medium mb-2">No consultation sessions found</p>
            <p className="text-sm">
              {isPhysician 
                ? "Accept virtual appointments to see consultation sessions here"
                : "Book virtual appointments to see consultation sessions here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSessionIcon(session.session_type)}
                      <h3 className="font-semibold">
                        {getSessionTypeLabel(session.session_type)} - {
                          isPhysician 
                            ? `${session.patient?.first_name} ${session.patient?.last_name}`
                            : `Dr. ${session.physician?.first_name} ${session.physician?.last_name}`
                        }
                      </h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {isPhysician && (
                        <p>Patient: {session.patient?.first_name} {session.patient?.last_name}</p>
                      )}
                      {isPatient && (
                        <p>Doctor: Dr. {session.physician?.first_name} {session.physician?.last_name}</p>
                      )}
                      <p>Rate: ₦{session.consultation_rate?.toLocaleString()}</p>
                      <p>Created: {new Date(session.created_at).toLocaleDateString()}</p>
                      {session.started_at && (
                        <p>Started: {new Date(session.started_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(session.status)}
                    <Badge variant="outline" className="text-xs">
                      {session.session_type === 'video' ? 'Video' : 'Chat'}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSession(session.id);
                    }}
                  >
                    {session.status === 'scheduled' && 'Join Session'}
                    {session.status === 'in_progress' && 'Continue Session'}
                    {session.status === 'completed' && 'View Session'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
