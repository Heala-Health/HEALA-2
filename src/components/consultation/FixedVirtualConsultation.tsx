
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Users, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConsultationSession {
  id: string;
  status: string;
  session_type: string;
  payment_status: string;
  consultation_rate: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  physician: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
  };
  consultation_rooms?: {
    id: string;
    room_token: string;
    room_status: string;
  }[];
}

export const FixedVirtualConsultation: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConsultationSessions();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`consultation_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_sessions'
        },
        () => {
          fetchConsultationSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConsultationSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Build the query based on user role
      let query = supabase
        .from('consultation_sessions')
        .select(`
          *,
          consultation_rooms(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Add role-based filtering
      if (profile?.role === 'patient') {
        query = query.eq('patient_id', user.id);
      } else if (profile?.role === 'physician') {
        query = query.eq('physician_id', user.id);
      } else {
        // For other roles, show no sessions
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Session fetch error:', error);
        throw error;
      }

      // Now fetch profile data for each session
      const sessionsWithProfiles = await Promise.all(
        (data || []).map(async (session) => {
          try {
            // Fetch patient profile
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', session.patient_id)
              .single();

            // Fetch physician profile
            const { data: physicianProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, specialization')
              .eq('id', session.physician_id)
              .single();

            return {
              ...session,
              patient: patientProfile || {
                id: session.patient_id,
                first_name: 'Unknown',
                last_name: 'Patient',
                email: 'unknown@example.com'
              },
              physician: physicianProfile || {
                id: session.physician_id,
                first_name: 'Unknown',
                last_name: 'Physician',
                specialization: 'General Practice'
              }
            };
          } catch (profileError) {
            console.error('Error fetching profiles for session:', session.id, profileError);
            return {
              ...session,
              patient: {
                id: session.patient_id,
                first_name: 'Unknown',
                last_name: 'Patient',
                email: 'unknown@example.com'
              },
              physician: {
                id: session.physician_id,
                first_name: 'Unknown',
                last_name: 'Physician',
                specialization: 'General Practice'
              }
            };
          }
        })
      );

      setSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('Error fetching consultation sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation sessions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    setJoinLoading(sessionId);
    
    try {
      // Update session status to in_progress
      const { error: updateError } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Session update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Joining Session",
        description: "Starting your virtual consultation...",
      });

      // Refresh sessions to show updated status
      fetchConsultationSessions();
      
      // Here you would typically redirect to the actual video call interface
      // For now, we'll just show a success message
      setTimeout(() => {
        toast({
          title: "Session Started",
          description: "You have successfully joined the consultation session.",
        });
      }, 1500);

    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Join Failed",
        description: "Failed to join the consultation session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading consultation sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No consultation sessions found</p>
              <p className="text-sm text-muted-foreground">
                {profile?.role === 'patient' 
                  ? 'Book an appointment to start your first consultation'
                  : 'Consultation sessions will appear here when scheduled'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPaymentStatusColor(session.payment_status)}>
                        {session.payment_status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {session.session_type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.created_at).toLocaleString('en-NG')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {profile?.role === 'patient' ? 'Physician' : 'Patient'}
                      </p>
                      <p className="font-semibold">
                        {profile?.role === 'patient' 
                          ? `Dr. ${session.physician.first_name} ${session.physician.last_name}`
                          : `${session.patient.first_name} ${session.patient.last_name}`
                        }
                      </p>
                      {profile?.role === 'patient' && session.physician.specialization && (
                        <p className="text-sm text-muted-foreground">
                          {session.physician.specialization}
                        </p>
                      )}
                      {profile?.role === 'physician' && (
                        <p className="text-sm text-muted-foreground">
                          {session.patient.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consultation Fee</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(session.consultation_rate)}
                      </p>
                      {session.duration_minutes && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {session.duration_minutes} minutes
                        </p>
                      )}
                    </div>
                  </div>

                  {session.status === 'scheduled' && session.payment_status === 'paid' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => joinSession(session.id)}
                        disabled={joinLoading === session.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {joinLoading === session.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Join Session
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {session.status === 'scheduled' && session.payment_status === 'pending' && (
                    <Alert>
                      <AlertDescription>
                        Payment is required to join this consultation session.
                      </AlertDescription>
                    </Alert>
                  )}

                  {session.status === 'in_progress' && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        <strong>Session is currently active!</strong>
                        {session.started_at && (
                          <span className="ml-2">
                            Started at {new Date(session.started_at).toLocaleTimeString('en-NG')}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
