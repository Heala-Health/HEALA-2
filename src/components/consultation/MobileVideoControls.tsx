
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Monitor, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  packetLoss: number;
  bitrate: number;
}

interface MobileVideoControlsProps {
  isCallActive: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  connectionQuality: ConnectionQuality;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  onReconnect: () => void;
  onStartScreenShare?: () => void;
  onToggleChat?: () => void;
}

export const MobileVideoControls: React.FC<MobileVideoControlsProps> = ({
  isCallActive,
  videoEnabled,
  audioEnabled,
  connectionQuality,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  onReconnect,
  onStartScreenShare,
  onToggleChat
}) => {
  const isMobile = useIsMobile();

  if (!isCallActive) {
    return null;
  }

  // Mobile layout - simplified controls
  if (isMobile) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-black bg-opacity-80 rounded-full px-4 py-2">
          {/* Essential controls only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVideo}
            className={`rounded-full w-12 h-12 ${videoEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAudio}
            className={`rounded-full w-12 h-12 ${audioEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* Chat Toggle */}
          {onToggleChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleChat}
              className="text-white rounded-full w-12 h-12 hover:bg-gray-700"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          )}

          {/* End Call */}
          <Button
            onClick={onEndCall}
            variant="destructive"
            className="rounded-full px-6 h-12"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        {/* Connection indicator for mobile */}
        {connectionQuality.level !== 'excellent' && connectionQuality.level !== 'disconnected' && (
          <div className="mt-2 text-center">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              connectionQuality.level === 'good' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
              connectionQuality.level === 'fair' ? 'bg-orange-500 bg-opacity-20 text-orange-300' :
              'bg-red-500 bg-opacity-20 text-red-300'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
              {connectionQuality.level}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - full controls
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <div className="flex items-center gap-4 bg-black bg-opacity-75 rounded-full px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVideo}
          className={`rounded-full ${videoEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAudio}
          className={`rounded-full ${audioEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        {onStartScreenShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onStartScreenShare}
            className="text-white rounded-full hover:bg-gray-700"
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </Button>
        )}

        {onToggleChat && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChat}
            className="text-white rounded-full hover:bg-gray-700"
            title="Toggle Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        )}

        {(connectionQuality.level === 'poor' || connectionQuality.level === 'fair') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReconnect}
            className="text-yellow-400 rounded-full hover:bg-gray-700"
            title="Reconnect"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        )}

        <Button
          onClick={onEndCall}
          variant="destructive"
          className="rounded-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </div>

      {connectionQuality.level !== 'excellent' && connectionQuality.level !== 'disconnected' && (
        <div className="mt-2 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            connectionQuality.level === 'good' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
            connectionQuality.level === 'fair' ? 'bg-orange-500 bg-opacity-20 text-orange-300' :
            'bg-red-500 bg-opacity-20 text-red-300'
          }`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            Connection: {connectionQuality.level} ({connectionQuality.latency}ms)
          </div>
        </div>
      )}
    </div>
  );
};
