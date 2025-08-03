
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EnhancedVirtualConsultationRoom } from '@/components/consultation/EnhancedVirtualConsultationRoom';
import { handleError } from '@/lib/errorHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ConsultationSession } from '@/components/consultation/types';

export const VirtualConsultationTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          physician:profiles(
            first_name,
            last_name,
            specialization
          )
        `)
        .eq('patient_id', user?.id)
        .eq('session_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our expected interface
      const transformedSessions = data?.map(session => ({
        ...session,
        physician: Array.isArray(session.physician) 
          ? session.physician[0] 
          : session.physician || { first_name: '', last_name: '', specialization: '' }
      })) || [];
      
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      handleError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedSession) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedSession(null)}
          className="mb-4"
        >
          ← Back to Sessions
        </Button>
        <EnhancedVirtualConsultationRoom
          sessionId={selectedSession}
          onSessionEnd={() => {
            setSelectedSession(null);
            fetchSessions();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <SkeletonLoader type="list" count={3} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultation Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No virtual consultation sessions yet</p>
              <p className="text-sm text-muted-foreground">
                Book an appointment to start a virtual consultation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        Dr. {session.physician?.first_name || 'Unknown'} {session.physician?.last_name || 'Physician'}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {session.physician?.specialization || 'General Practice'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>₦{session.consultation_rate}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedSession(session.id)}
                      variant={session.status === 'scheduled' || session.status === 'in_progress' ? 'default' : 'outline'}
                      disabled={session.status === 'completed'}
                    >
                      {session.status === 'scheduled' ? 'Join Session' :
                       session.status === 'in_progress' ? 'Rejoin Session' :
                       'View Session'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
