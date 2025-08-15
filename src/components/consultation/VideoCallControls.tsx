
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, Monitor, MonitorOff } from 'lucide-react';

interface VideoCallControlsProps {
  isCallActive: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  endCall: () => void;
  startScreenShare?: () => void;
  stopScreenShare?: () => void;
  isScreenSharing?: boolean;
}

export const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isCallActive,
  videoEnabled,
  audioEnabled,
  toggleVideo,
  toggleAudio,
  endCall,
  startScreenShare,
  stopScreenShare,
  isScreenSharing = false
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVideo}
          className={`rounded-full ${videoEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAudio}
          className={`rounded-full ${audioEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        {startScreenShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`rounded-full ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'}`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={endCall}
          className="rounded-full bg-red-500 text-white hover:bg-red-600"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};
