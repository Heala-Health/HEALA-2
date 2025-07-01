
import { useState, useEffect, useRef, useCallback } from 'react';

interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  packetLoss: number;
  bitrate: number;
}

interface ConnectionMonitorProps {
  peerConnection: RTCPeerConnection | null;
  isCallActive: boolean;
  onConnectionQualityChange: (quality: ConnectionQuality) => void;
  onReconnectionNeeded: () => void;
}

export const useConnectionMonitor = ({
  peerConnection,
  isCallActive,
  onConnectionQualityChange,
  onReconnectionNeeded
}: ConnectionMonitorProps) => {
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    level: 'disconnected',
    latency: 0,
    packetLoss: 0,
    bitrate: 0
  });

  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const maxReconnectionAttempts = 3;
  const qualityCheckInterval = useRef<NodeJS.Timeout>();
  const reconnectionTimeout = useRef<NodeJS.Timeout>();

  const calculateConnectionQuality = useCallback(async () => {
    if (!peerConnection || !isCallActive) return;

    try {
      const stats = await peerConnection.getStats();
      let latency = 0;
      let packetLoss = 0;
      let bitrate = 0;

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          latency = report.currentRoundTripTime * 1000 || 0;
        }
        
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 1;
          packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
          bitrate = report.bytesReceived || 0;
        }
      });

      // Determine quality level
      let level: ConnectionQuality['level'] = 'excellent';
      
      if (latency > 300 || packetLoss > 5) {
        level = 'poor';
      } else if (latency > 200 || packetLoss > 3) {
        level = 'fair';
      } else if (latency > 100 || packetLoss > 1) {
        level = 'good';
      }

      const quality: ConnectionQuality = {
        level,
        latency: Math.round(latency),
        packetLoss: Math.round(packetLoss * 100) / 100,
        bitrate: Math.round(bitrate / 1024) // Convert to KB
      };

      setConnectionQuality(quality);
      onConnectionQualityChange(quality);

      // Trigger reconnection if quality is poor
      if (level === 'poor' && reconnectionAttempts < maxReconnectionAttempts) {
        console.log('🔄 [ConnectionMonitor] Poor connection detected, triggering reconnection');
        triggerReconnection();
      }

    } catch (error) {
      console.error('❌ [ConnectionMonitor] Error calculating connection quality:', error);
    }
  }, [peerConnection, isCallActive, reconnectionAttempts, onConnectionQualityChange]);

  const triggerReconnection = useCallback(() => {
    if (reconnectionTimeout.current) return; // Prevent multiple reconnection attempts

    setReconnectionAttempts(prev => prev + 1);
    
    reconnectionTimeout.current = setTimeout(() => {
      console.log(`🔄 [ConnectionMonitor] Attempting reconnection ${reconnectionAttempts + 1}/${maxReconnectionAttempts}`);
      onReconnectionNeeded();
      reconnectionTimeout.current = undefined;
    }, 2000); // Wait 2 seconds before reconnecting

  }, [reconnectionAttempts, onReconnectionNeeded]);

  // Start monitoring when call becomes active
  useEffect(() => {
    if (isCallActive && peerConnection) {
      console.log('📊 [ConnectionMonitor] Starting connection quality monitoring');
      
      qualityCheckInterval.current = setInterval(calculateConnectionQuality, 2000);
      
      // Initial quality check
      calculateConnectionQuality();
    } else {
      console.log('📊 [ConnectionMonitor] Stopping connection quality monitoring');
      
      if (qualityCheckInterval.current) {
        clearInterval(qualityCheckInterval.current);
        qualityCheckInterval.current = undefined;
      }
      
      setConnectionQuality({
        level: 'disconnected',
        latency: 0,
        packetLoss: 0,
        bitrate: 0
      });
    }

    return () => {
      if (qualityCheckInterval.current) {
        clearInterval(qualityCheckInterval.current);
      }
      if (reconnectionTimeout.current) {
        clearTimeout(reconnectionTimeout.current);
      }
    };
  }, [isCallActive, peerConnection, calculateConnectionQuality]);

  // Reset reconnection attempts when connection is restored
  useEffect(() => {
    if (connectionQuality.level === 'excellent' || connectionQuality.level === 'good') {
      setReconnectionAttempts(0);
    }
  }, [connectionQuality.level]);

  return {
    connectionQuality,
    reconnectionAttempts,
    maxReconnectionAttempts
  };
};
