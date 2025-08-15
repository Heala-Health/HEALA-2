
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConsultationSession {
  id: string;
  patient_id: string;
  physician_id: string;
  consultation_rate: number;
  status: string;
  payment_status: string;
  session_type: string;
  created_at: string;
}

interface VirtualConsultationRoomProps {
  sessionId: string;
}

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        const { data, error } = await supabase
          .from('consultation_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation session",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, toast]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading consultation session...</div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Consultation session not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Virtual Consultation Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Local Video</div>
          </div>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Remote Video</div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Mic className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          Consultation Rate: ₦{session.consultation_rate} | Status: {session.status}
        </div>
      </CardContent>
    </Card>
  );
};
