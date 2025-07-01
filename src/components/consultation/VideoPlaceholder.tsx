
import React from 'react';
import { Video } from 'lucide-react';

interface VideoPlaceholderProps {
  isCallActive: boolean;
  sessionStatus: string;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  isCallActive,
  sessionStatus
}) => {
  if (isCallActive) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-white text-center">
        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">Video Call Interface</p>
        <p className="text-sm opacity-75">
          {sessionStatus === 'scheduled' ? 'Ready to start video consultation' : 
           sessionStatus === 'in_progress' ? 'Session is active - click "Start Video Call" to connect' :
           'Session ended'}
        </p>
      </div>
    </div>
  );
};
