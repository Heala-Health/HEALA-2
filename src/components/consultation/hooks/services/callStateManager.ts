
import { useState } from 'react';

export const useCallState = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callInitiator, setCallInitiator] = useState<string>('');

  const resetCallState = () => {
    setIsCallActive(false);
    setIncomingCall(false);
    setConnectionState('new');
  };

  return {
    // State
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    incomingCall,
    callInitiator,
    
    // Setters
    setIsCallActive,
    setConnectionState,
    setVideoEnabled,
    setAudioEnabled,
    setIncomingCall,
    setCallInitiator,
    resetCallState
  };
};
