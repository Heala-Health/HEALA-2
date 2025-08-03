
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Signal,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useConsultationSession } from './hooks/useConsultationSession';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleError, showSuccess } from '@/lib/errorHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface EnhancedVirtualConsultationRoomProps {
  sessionId: string;
  onSessionEnd?: () => void;
}

export const EnhancedVirtualConsultationRoom: React.FC<EnhancedVirtualConsultationRoomProps> = ({
  sessionId,
  onSessionEnd
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const {
    session,
    loading,
    sessionDuration,
    connectionStatus,
    startSession,
    endSession,
    formatDuration
  } = useConsultationSession(sessionId);

  const {
    connection,
    toggleVideo,
    toggleAudio,
    endCall,
    reconnect
  } = useWebRTC(sessionId, session?.physician_id === user?.id);

  useEffect(() => {
    if (session && session.status === 'scheduled' && user) {
      // Auto-start session when user enters room
      startSession(user.id).catch((error) => {
        console.error('Error starting session:', error);
        handleError(error, toast);
      });
    }
  }, [session, user, startSession, toast]);

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleAudio = () => {
    toggleAudio();
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndCall = async () => {
    if (!user || !session) return;
    
    try {
      await endSession(user.id);
      endCall();
      showSuccess('Consultation ended successfully', toast);
      onSessionEnd?.();
    } catch (error) {
      console.error('Error ending session:', error);
      handleError(error, toast);
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        setIsScreenSharing(true);
        showSuccess('Screen sharing started', toast);
        
        // Listen for screen share end
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } else {
        // Stop screen sharing and return to camera
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error with screen sharing:', error);
      toast({
        title: 'Screen Share Error',
        description: 'Could not start screen sharing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getConnectionQualityColor = () => {
    switch (connection.connectionQuality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connection.connectionQuality) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4" />;
      case 'good':
        return <Clock className="w-4 h-4" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Signal className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSpinner size="lg" text="Loading consultation room..." />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Session not found or you don't have permission to access this room.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Virtual Consultation
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                {session.status}
              </Badge>
              
              {session.status === 'in_progress' && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatDuration(sessionDuration)}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connection.isConnected ? 'bg-green-500' : 
                connection.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {connection.isConnected ? 'Connected' : 
                 connection.isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${getConnectionQualityColor()}`}>
              {getConnectionQualityIcon()}
              <span className="text-sm capitalize">{connection.connectionQuality}</span>
            </div>
          </div>
          
          {connection.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {connection.error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={reconnect}
                  className="ml-2"
                >
                  Reconnect
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Video Interface */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Local Video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {connection.localStream ? (
                <video
                  ref={(video) => {
                    if (video && connection.localStream) {
                      video.srcObject = connection.localStream;
                    }
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <Video className="w-12 h-12 opacity-50" />
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isScreenSharing && '(Screen)'}
              </div>
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-white opacity-75" />
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {connection.remoteStream ? (
                <video
                  ref={(video) => {
                    if (video && connection.remoteStream) {
                      video.srcObject = connection.remoteStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-12 h-12 opacity-50 mx-auto mb-2" />
                    <p className="text-sm opacity-75">
                      {session.physician_id === user?.id ? 'Waiting for patient...' : 'Waiting for physician...'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {session.physician_id === user?.id ? 
                  `${session.patient?.first_name} ${session.patient?.last_name}` : 
                  `Dr. ${session.physician?.first_name} ${session.physician?.last_name}`
                }
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={handleToggleVideo}
              className="rounded-full w-12 h-12 p-0"
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="lg"
              onClick={handleToggleAudio}
              className="rounded-full w-12 h-12 p-0"
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="lg"
              onClick={handleScreenShare}
              className="rounded-full w-12 h-12 p-0"
            >
              <Monitor className="w-5 h-5" />
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-12 h-12 p-0"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Patient</p>
              <p className="text-lg">{session.patient?.first_name} {session.patient?.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Physician</p>
              <p className="text-lg">Dr. {session.physician?.first_name} {session.physician?.last_name}</p>
              <p className="text-sm text-muted-foreground">{session.physician?.specialization}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Session Type</p>
              <p className="text-lg capitalize">{session.session_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Consultation Rate</p>
              <p className="text-lg">₦{session.consultation_rate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
