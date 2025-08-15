import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw, Play } from 'lucide-react';

interface DevConsoleProps {
  sessionId?: string;
  userId?: string;
}

export const DevConsole: React.FC<DevConsoleProps> = ({ sessionId, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);

  const fetchData = async () => {
    if (!sessionId) return;

    // Fetch session data
    const { data: session } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    // Fetch room data
    const { data: room } = await supabase
      .from('consultation_rooms')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    setSessionData(session);
    setRoomData(room);
  };

  const createTestSession = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('consultation_sessions')
      .insert({
        patient_id: userId,
        physician_id: 'c48a9b68-2144-4767-a3d1-395fab939a50', // Test physician
        consultation_rate: 100,
        session_type: 'video',
        status: 'scheduled',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test session:', error);
    } else {
      console.log('Created test session:', data);
      window.location.reload(); // Refresh to show new session
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="bg-yellow-100 border-yellow-300">
            <ChevronDown className="w-4 h-4 mr-1" />
            Dev Console
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 w-80 bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex gap-2">
                <Button onClick={fetchData} size="sm" variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                <Button onClick={createTestSession} size="sm" variant="outline">
                  <Play className="w-3 h-3 mr-1" />
                  Create Test Session
                </Button>
              </div>
              
              <div>
                <strong>Session ID:</strong> {sessionId || 'None'}
              </div>
              
              <div>
                <strong>User ID:</strong> {userId || 'None'}
              </div>
              
              {sessionData && (
                <div>
                  <strong>Session Status:</strong> {sessionData.status}
                  <br />
                  <strong>Session Type:</strong> {sessionData.session_type}
                  <br />
                  <strong>Payment:</strong> {sessionData.payment_status}
                </div>
              )}
              
              {roomData && (
                <div>
                  <strong>Room Status:</strong> {roomData.room_status}
                  <br />
                  <strong>Patient Joined:</strong> {roomData.patient_joined ? 'Yes' : 'No'}
                  <br />
                  <strong>Physician Joined:</strong> {roomData.physician_joined ? 'Yes' : 'No'}
                </div>
              )}
              
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <div>Check browser console for WebRTC logs</div>
                <div>Look for 🎥, 📡, 🔗, 🧊 emojis</div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};