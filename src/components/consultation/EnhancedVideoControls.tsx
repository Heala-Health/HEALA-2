
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Monitor, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  packetLoss: number;
  bitrate: number;
}

interface EnhancedVideoControlsProps {
  isCallActive: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  sessionStatus: string;
  connectionQuality: ConnectionQuality;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  onReconnect: () => void;
  onStartScreenShare?: () => void;
  onToggleChat?: () => void;
}

export const EnhancedVideoControls: React.FC<EnhancedVideoControlsProps> = ({
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

  // Mobile layout - simplified and touch-friendly
  if (isMobile) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-black bg-opacity-90 rounded-full px-4 py-3">
          {/* Essential controls with larger touch targets */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleVideo}
            className={`rounded-full w-14 h-14 ${videoEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
          >
            {videoEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAudio}
            className={`rounded-full w-14 h-14 ${audioEnabled ? 'text-white hover:bg-gray-700' : 'text-red-400 bg-red-600 hover:bg-red-700'}`}
          >
            {audioEnabled ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </Button>

          {/* Chat Toggle */}
          {onToggleChat && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleChat}
              className="text-white rounded-full w-14 h-14 hover:bg-gray-700"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          )}

          {/* End Call - prominently displayed */}
          <Button
            onClick={onEndCall}
            variant="destructive"
            className="rounded-full px-6 h-14 text-lg font-semibold"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile connection indicator */}
        {connectionQuality.level !== 'excellent' && connectionQuality.level !== 'disconnected' && (
          <div className="mt-3 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
              connectionQuality.level === 'good' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
              connectionQuality.level === 'fair' ? 'bg-orange-500 bg-opacity-20 text-orange-300' :
              'bg-red-500 bg-opacity-20 text-red-300'
            }`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              {connectionQuality.level.toUpperCase()}
              {connectionQuality.level === 'poor' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReconnect}
                  className="text-current hover:bg-white hover:bg-opacity-20 ml-2 h-6 px-2"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - full feature set
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

        {/* Screen Share (desktop only, physician only) */}
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

        {/* Chat Toggle */}
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

        {/* Reconnect Button (shown when connection is poor) */}
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

        {/* End Call */}
        <Button
          onClick={onEndCall}
          variant="destructive"
          className="rounded-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </div>

      {/* Desktop connection quality status */}
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
