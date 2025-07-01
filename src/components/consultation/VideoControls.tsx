
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle } from 'lucide-react';

interface VideoControlsProps {
  isCallActive: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  sessionStatus: string;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onStartSession: () => void;
  onStartCall: () => void;
  onEndCall: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isCallActive,
  videoEnabled,
  audioEnabled,
  sessionStatus,
  onToggleVideo,
  onToggleAudio,
  onStartSession,
  onStartCall,
  onEndCall
}) => {
  // Only show controls during active call
  if (!isCallActive) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <div className="flex items-center gap-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVideo}
          className={`rounded-full ${videoEnabled ? 'text-white' : 'text-red-400'}`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAudio}
          className={`rounded-full ${audioEnabled ? 'text-white' : 'text-red-400'}`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          onClick={onEndCall}
          variant="destructive"
          className="rounded-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          End Call
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white rounded-full"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
