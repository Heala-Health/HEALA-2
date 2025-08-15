
import React from 'react';

interface VideoStreamsProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isCallActive: boolean;
  connectionState: string;
}

export const VideoStreams: React.FC<VideoStreamsProps> = ({
  localVideoRef,
  remoteVideoRef,
  isCallActive,
  connectionState
}) => {
  return (
    <>
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-gray-800"
      />
      
      {/* Local Video Preview */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white shadow-lg bg-gray-700"
        style={{ display: isCallActive ? 'block' : 'none' }}
      />

      {/* Placeholder when no remote stream */}
      {isCallActive && connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-lg">
              {connectionState === 'connecting' ? 'Connecting to other participant...' : 
               connectionState === 'new' ? 'Waiting for other participant...' :
               connectionState === 'disconnected' ? 'Connection lost. Reconnecting...' :
               'Establishing connection...'}
            </p>
            {connectionState === 'connecting' && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
