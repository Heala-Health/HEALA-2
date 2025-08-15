import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Video, 
  Clock, 
  User, 
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '@/components/consultation/types';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EnhancedVirtualConsultationRoom } from '@/components/consultation/EnhancedVirtualConsultationRoom';
import { useRealTimeConsultationUpdates } from '@/components/consultation/hooks/useRealTimeConsultationUpdates';
import { useScheduledSessionManager } from '@/components/consultation/hooks/useScheduledSessionManager';
import { usePresenceTracking } from '@/components/consultation/hooks/usePresenceTracking';
import { useToast } from '@/hooks/use-toast';

export const PhysicianVirtualConsultationTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Real-time updates and presence tracking
  const { activeSessions, isMonitoring } = useRealTimeConsultationUpdates({
    onSessionStarted: (session) => {
      console.log('📍 [PhysicianVirtualConsultation] New session started:', session);
      fetchSessions(); // Refresh the list
    },
    onSessionUpdated: (session) => {
      console.log('📍 [PhysicianVirtualConsultation] Session updated:', session);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
    }
  });

  const { 
    upcomingSessions, 
    readySessions, 
    checkSessionAvailability,
    getSessionTimeUntilReady 
  } = useScheduledSessionManager({
    onSessionReady: (session) => {
      toast({
        title: "Session Ready",
        description: `Consultation with ${session.patient?.first_name} ${session.patient?.last_name} is ready to start.`,
      });
    }
  });

  const { getParticipantStatus, getOnlineParticipants } = usePresenceTracking();

  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: sessionsData, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('physician_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionsWithProfiles: ConsultationSession[] = (sessionsData || []).map(session => ({
        ...session,
        patient: { first_name: 'Unknown', last_name: 'Patient' },
        physician: { first_name: 'Dr.', last_name: 'Unknown', specialization: 'General' }
      }));
      setSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('❌ [PhysicianVirtualConsultation] Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation sessions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'outline';
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = useCallback((session: ConsultationSession) => {
    const availability = checkSessionAvailability(session.id);
    const patientPresence = getParticipantStatus(session.patient_id);
    
    if (session.status === 'in_progress') {
      return <Video className="w-4 h-4 text-green-600" />;
    }
    
    if (availability === 'ready' && patientPresence?.status === 'online') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    
    if (availability === 'ready') {
      return <Timer className="w-4 h-4 text-yellow-600" />;
    }
    
    if (availability === 'expired') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-600" />;
  }, [checkSessionAvailability, getParticipantStatus]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatTimeUntilReady = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleJoinSession = (sessionId: string) => {
    const availability = checkSessionAvailability(sessionId);
    
    if (availability === 'expired') {
      toast({
        title: "Session Expired",
        description: "This consultation session has expired.",
        variant: "destructive"
      });
      return;
    }
    
    if (availability === 'not_ready') {
      const timeUntil = getSessionTimeUntilReady(sessionId);
      toast({
        title: "Session Not Ready",
        description: `This session will be available in ${formatTimeUntilReady(timeUntil)}.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSession(sessionId);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  if (selectedSession) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={handleBackToList}
          className="mb-4"
        >
          ← Back to Sessions
        </Button>
        <EnhancedVirtualConsultationRoom 
          sessionId={selectedSession}
          onSessionEnd={handleBackToList}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonLoader count={3} type="card" />
        </CardContent>
      </Card>
    );
  }

  const activeSessionsToday = sessions.filter(s => s.status === 'in_progress');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultations
            {isMonitoring && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Live monitoring</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeSessionsToday.length}</div>
              <div className="text-sm text-muted-foreground">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{readySessions.length}</div>
              <div className="text-sm text-muted-foreground">Ready to Start</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{upcomingSessions.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessionsToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-600" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessionsToday.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session)}
                    <div>
                      <h4 className="font-medium">
                        {session.patient?.first_name} {session.patient?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Started: {formatDate(session.started_at || session.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">In Progress</Badge>
                    <Button 
                      onClick={() => handleJoinSession(session.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ready Sessions */}
      {readySessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Ready to Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {readySessions.map((session) => {
              const patientPresence = useMemo(() => getParticipantStatus(session.patient_id), [session.patient_id, getParticipantStatus]);
              return (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(session)}
                      <div>
                        <h4 className="font-medium">
                          {session.patient?.first_name} {session.patient?.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {formatDate(session.created_at)}
                        </p>
                        {patientPresence && (
                          <p className="text-xs text-green-600">
                            Patient is {patientPresence.status}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="font-medium">₦{session.consultation_rate}</div>
                      </div>
                      <Button 
                        onClick={() => handleJoinSession(session.id)}
                        variant="default"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => {
              const timeUntilReady = getSessionTimeUntilReady(session.id);
              return (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(session)}
                      <div>
                        <h4 className="font-medium">
                          {session.patient?.first_name} {session.patient?.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {formatDate(session.created_at)}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Available in {formatTimeUntilReady(timeUntilReady)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="font-medium">₦{session.consultation_rate}</div>
                      </div>
                      <Button 
                        onClick={() => handleJoinSession(session.id)}
                        variant="secondary"
                        disabled
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Not Ready
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            All Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No consultation sessions yet.</p>
              <p className="text-sm">Sessions will appear here when patients book virtual consultations with you.</p>
            </div>
          ) : (
            sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session)}
                    <div>
                      <h4 className="font-medium">
                        {session.patient?.first_name} {session.patient?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                    <div className="text-right text-sm">
                      <div className="font-medium">₦{session.consultation_rate}</div>
                    </div>
                    {(session.status === 'scheduled' || session.status === 'in_progress') && (
                      <Button 
                        onClick={() => handleJoinSession(session.id)}
                        variant={session.status === 'in_progress' ? 'default' : 'secondary'}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {session.status === 'in_progress' ? 'Join' : 'Start'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};