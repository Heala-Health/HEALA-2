
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, RefreshCw, Monitor } from 'lucide-react';
import { ConsultationSession } from './types';

interface ConsultationControlsProps {
  isCallActive: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  endCall: () => void;
  reconnect: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  toggleChat: () => void;
  showChat: boolean;
  isPhysician?: boolean;
  sessionData: ConsultationSession;
  paymentCompleted: boolean;
  processing: boolean;
  handlePayment: () => void;
}

export const ConsultationControls: React.FC<ConsultationControlsProps> = ({
  isCallActive,
  videoEnabled,
  audioEnabled,
  toggleVideo,
  toggleAudio,
  endCall,
  reconnect,
  startScreenShare,
  stopScreenShare,
  toggleChat,
  showChat,
  isPhysician = false,
  sessionData,
  paymentCompleted,
  processing,
  handlePayment
}) => {
  return (
    <>
      {/* Payment UI - Show if payment is not completed and user is patient */}
      {!isPhysician && !paymentCompleted && (
        <div className="absolute top-4 left-4 bg-white text-gray-800 rounded-md shadow-md p-4 z-10">
          <h3 className="text-lg font-semibold mb-2">Consultation Payment</h3>
          <p className="mb-2">
            Consultation Rate: ₦{sessionData.consultation_rate.toLocaleString()}
          </p>
          <Button onClick={handlePayment} disabled={processing}>
            {processing ? 'Processing Payment...' : 'Pay Now'}
          </Button>
        </div>
      )}

      {/* Chat Toggle Button */}
      <Button
        variant="secondary"
        className="absolute bottom-4 left-4 z-10"
        onClick={toggleChat}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {showChat ? 'Hide Chat' : 'Show Chat'}
      </Button>

      {/* Main Video Controls */}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={startScreenShare}
            className="rounded-full bg-white/20 text-white"
          >
            <Monitor className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={reconnect}
            className="rounded-full bg-white/20 text-white"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          
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
    </>
  );
};
