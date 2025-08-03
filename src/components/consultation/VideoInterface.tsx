
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
import { VideoStreams } from './VideoStreams';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
import { ConsultationActions } from './ConsultationActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoInterfaceProps {
  session: ConsultationSession;
  onStartSession: () => void;
  onEndSession: () => void;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({
  session,
  onStartSession,
  onEndSession
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState(session);
  const [hasConsultationRoom, setHasConsultationRoom] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [VideoInterface] Render with session:', { 
    sessionId: currentSession.id,
    sessionStatus: currentSession.status, 
    sessionType: currentSession.session_type,
    userRole: profile?.role,
    timestamp: new Date().toISOString()
  });

  // Update session when prop changes
  useEffect(() => {
    console.log('🔄 [VideoInterface] Session prop updated:', {
      oldStatus: currentSession.status,
      newStatus: session.status,
      oldType: currentSession.session_type,
      newType: session.session_type
    });
    setCurrentSession(session);
  }, [session, currentSession.status, currentSession.session_type]);

  // Check if consultation room exists for video sessions
  useEffect(() => {
    if (currentSession.session_type !== 'video') {
      setHasConsultationRoom(false);
      setCheckingRoom(false);
      return;
    }

    const checkConsultationRoom = async () => {
      try {
        console.log('🔍 [VideoInterface] Checking consultation room for session:', currentSession.id);
        
        const { data: room, error } = await supabase
          .from('consultation_rooms')
          .select('*')
          .eq('session_id', currentSession.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ [VideoInterface] Error checking consultation room:', error);
          setHasConsultationRoom(false);
        } else if (room) {
          console.log('✅ [VideoInterface] Consultation room found:', room);
          setHasConsultationRoom(true);
        } else {
          console.log('⚠️ [VideoInterface] No consultation room found for video session');
          setHasConsultationRoom(false);
        }
      } catch (error) {
        console.error('💥 [VideoInterface] Fatal error checking room:', error);
        setHasConsultationRoom(false);
      } finally {
        setCheckingRoom(false);
      }
    };

    checkConsultationRoom();
  }, [currentSession.id, currentSession.session_type]);

  // Function to create missing consultation room
  const createMissingRoom = async () => {
    if (currentSession.session_type !== 'video' || !user?.id) return;

    setCreatingRoom(true);
    try {
      console.log('🔧 [VideoInterface] Creating missing consultation room for session:', currentSession.id);
      
      const roomToken = 'room_' + currentSession.id;
      const { data: newRoom, error: createError } = await supabase
        .from('consultation_rooms')
        .insert({
          session_id: currentSession.id,
          room_token: roomToken,
          room_status: 'waiting'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [VideoInterface] Failed to create consultation room:', createError);
        toast({
          title: "❌ Failed to Create Room",
          description: "Could not create the consultation room. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [VideoInterface] Consultation room created successfully:', newRoom);
      setHasConsultationRoom(true);
      
      toast({
        title: "✅ Room Created",
        description: "Consultation room has been created. You can now start the video session.",
      });

    } catch (error) {
      console.error('💥 [VideoInterface] Error creating room:', error);
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred while creating the room.",
        variant: "destructive"
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  // Set up real-time session monitoring
  useEffect(() => {
    if (!currentSession.id) return;

    console.log('📡 [VideoInterface] Setting up real-time monitoring for session:', currentSession.id);
    
    const channel = supabase
      .channel(`session_${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${currentSession.id}`
        },
        (payload) => {
          console.log('📨 [VideoInterface] Real-time session update:', payload);
          const updatedSession = payload.new as any;
          
          setCurrentSession(prev => {
            const newSession = {
              ...prev,
              ...updatedSession,
              // Keep the profile data from the previous state
              patient: prev.patient,
              physician: prev.physician
            };
            
            console.log('📨 [VideoInterface] Session state updated:', {
              oldStatus: prev.status,
              newStatus: newSession.status,
              oldType: prev.session_type,
              newType: newSession.session_type,
              isPatient,
              isPhysician
            });
            
            return newSession;
          });

          // Show notification to patient when session starts
          if (isPatient && updatedSession.status === 'in_progress' && currentSession.status === 'scheduled') {
            console.log('🎯 [VideoInterface] Notifying patient of consultation start');
            toast({
              title: "🚨 Doctor Started Consultation!",
              description: "The video consultation is ready. Click 'Join Now' to enter the call.",
              duration: 10000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [VideoInterface] Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 [VideoInterface] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentSession.id, isPatient, currentSession.status, toast]);

  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    isConnecting,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTCVideoCall({
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient'
  });

  const handleStartConsultation = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive"
      });
      return;
    }

    if (currentSession.session_type === 'video' && !hasConsultationRoom) {
      // Try to create the missing room first
      await createMissingRoom();
      
      // Check if room creation was successful
      if (!hasConsultationRoom) {
        return; // Error already shown in createMissingRoom
      }
    }

    try {
      console.log('👨‍⚕️ [VideoInterface] Starting consultation for session:', currentSession.id);
      
      await onStartSession();
      
      toast({
        title: "🚀 Video Consultation Started",
        description: "Session is now active. Patient has been notified and can join.",
        duration: 5000,
      });
      
    } catch (error) {
      console.error('❌ [VideoInterface] Error starting consultation:', error);
      toast({
        title: "Error Starting Consultation",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleJoinCall = async () => {
    if (currentSession.session_type === 'video' && !hasConsultationRoom) {
      toast({
        title: "❌ Cannot Join Video Call",
        description: "This video session is missing its consultation room. Please refresh the page or contact support.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('👤 [VideoInterface] User joining video call');
      
      // For patients, ensure session is marked as in_progress when they join
      if (isPatient && currentSession.status === 'scheduled') {
        console.log('👤 [VideoInterface] Patient joining - updating session to in_progress');
        
        const updateData = {
          status: 'in_progress' as const,
          started_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('consultation_sessions')
          .update(updateData)
          .eq('id', currentSession.id);

        if (error) {
          console.error('❌ [VideoInterface] Error updating session for patient join:', error);
        } else {
          console.log('✅ [VideoInterface] Session updated successfully for patient join');
          
          // Update local state
          setCurrentSession(prev => ({
            ...prev,
            ...updateData
          }));
        }
      }
      
      // Start the actual video call
      startCall();
      
      toast({
        title: "📞 Joining Video Call",
        description: "Connecting to the video consultation...",
      });
    } catch (error) {
      console.error('❌ [VideoInterface] Error joining call:', error);
      toast({
        title: "Error Joining Call",
        description: "Failed to join video call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndSession = () => {
    console.log('📞 [VideoInterface] Ending video session');
    endCall();
    onEndSession();
  };

  // Show loading state while checking consultation room
  if (checkingRoom && currentSession.session_type === 'video') {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px] flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Preparing video consultation...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show video interface when call is active
  if (isCallActive || isConnecting) {
    console.log('🖥️ [VideoInterface] Showing active video interface');
    return (
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
            <VideoStreams
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isCallActive={isCallActive}
              connectionState={connectionState}
            />

            <VideoConnectionStatus
              isCallActive={isCallActive}
              connectionState={connectionState}
              isConnecting={isConnecting}
            />
            
            <VideoControls
              isCallActive={isCallActive}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              sessionStatus={currentSession.status}
              onToggleVideo={toggleVideo}
              onToggleAudio={toggleAudio}
              onStartSession={onStartSession}
              onStartCall={handleJoinCall}
              onEndCall={handleEndSession}
            />

            {/* Enhanced status overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-20">
              <div>User: {profile?.role}</div>
              <div>Session: {currentSession.status}</div>
              <div>Type: {currentSession.session_type}</div>
              <div>Room: {hasConsultationRoom ? 'Ready' : 'Missing'}</div>
              <div>Connection: {connectionState}</div>
              <div>Call: {isCallActive ? 'Active' : 'Inactive'}</div>
              <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show consultation actions for non-active calls
  console.log('🖥️ [VideoInterface] Showing consultation actions interface');
  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
          {/* Show room creation option if room is missing */}
          {currentSession.session_type === 'video' && !hasConsultationRoom && isPhysician && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-30">
              <div className="bg-red-600 text-white p-6 rounded-lg max-w-md text-center">
                <h3 className="text-lg font-semibold mb-2">❌ Cannot Start Video Session</h3>
                <p className="mb-4">This video session is missing its consultation room.</p>
                <button 
                  onClick={createMissingRoom}
                  disabled={creatingRoom}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {creatingRoom ? 'Creating Room...' : 'Create Room'}
                </button>
              </div>
            </div>
          )}

          <ConsultationActions
            sessionStatus={currentSession.status}
            isPhysician={isPhysician}
            isPatient={isPatient}
            consultationStarted={currentSession.status === 'in_progress'}
            showJoinButton={currentSession.status === 'in_progress' && hasConsultationRoom}
            isCallActive={isCallActive}
            autoJoinAttempted={false}
            onStartConsultation={handleStartConsultation}
            onPatientJoin={handleJoinCall}
            onStartCall={handleJoinCall}
            onEnableManualJoin={() => {}}
          />

          {/* Enhanced status overlay */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
            <div>User: {profile?.role}</div>
            <div>Session: {currentSession.status}</div>
            <div>Type: {currentSession.session_type}</div>
            <div>Room: {currentSession.session_type === 'video' ? (hasConsultationRoom ? 'Ready' : 'Missing') : 'N/A'}</div>
            <div>Show Join: {currentSession.status === 'in_progress' && hasConsultationRoom ? 'Yes' : 'No'}</div>
            <div>Is Patient: {isPatient ? 'Yes' : 'No'}</div>
            <div>Is Physician: {isPhysician ? 'Yes' : 'No'}</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
