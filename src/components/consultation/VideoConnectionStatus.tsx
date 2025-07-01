
import React from 'react';

interface VideoConnectionStatusProps {
  isCallActive: boolean;
  connectionState: string;
  isConnecting?: boolean;
}

export const VideoConnectionStatus: React.FC<VideoConnectionStatusProps> = ({
  isCallActive,
  connectionState,
  isConnecting = false
}) => {
  if (!isCallActive && !isConnecting) {
    return null;
  }

  if (connectionState === 'connected') {
    return null;
  }

  const getStatusText = () => {
    if (isConnecting) return 'Initializing video call...';
    
    switch (connectionState) {
      case 'connecting':
        return 'Connecting to video call...';
      case 'new':
        return 'Setting up connection...';
      case 'failed':
        return 'Connection failed - Please try again';
      case 'disconnected':
        return 'Disconnected - Attempting to reconnect...';
      case 'closed':
        return 'Call ended';
      default:
        return `Connection status: ${connectionState}`;
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'failed':
        return 'text-red-400';
      case 'disconnected':
        return 'text-yellow-400';
      case 'closed':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="text-center">
        {connectionState !== 'failed' && (
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        )}
        {connectionState === 'failed' && (
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
        )}
        <p className={`text-lg ${getStatusColor()}`}>
          {getStatusText()}
        </p>
      </div>
    </div>
  );
};
