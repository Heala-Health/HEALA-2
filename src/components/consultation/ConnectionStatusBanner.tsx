import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusBannerProps {
  connectionState: RTCPeerConnectionState;
  isConnecting: boolean;
  onReconnect: () => void;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  connectionState,
  isConnecting,
  onReconnect
}) => {
  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: '✅ Connected',
          description: 'Video call is active'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: '🔄 Connecting...',
          description: 'Establishing connection'
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          text: '❌ Disconnected',
          description: 'Connection lost'
        };
      case 'failed':
        return {
          color: 'bg-red-600',
          text: '❌ Connection Failed',
          description: 'Unable to connect'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: '⏳ Waiting...',
          description: 'Preparing connection'
        };
    }
  };

  const status = getStatusInfo();

  if (connectionState === 'connected') {
    return null; // Don't show banner when connected
  }

  return (
    <div className={`${status.color} text-white px-4 py-2 flex items-center justify-between`}>
      <div className="flex items-center space-x-2">
        <span className="font-medium">{status.text}</span>
        <span className="text-sm opacity-90">{status.description}</span>
        {isConnecting && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
      </div>
      
      {(connectionState === 'disconnected' || connectionState === 'failed') && (
        <Button
          onClick={onReconnect}
          variant="outline"
          size="sm"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};