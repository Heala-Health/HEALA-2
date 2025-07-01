
import React from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';

interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  packetLoss: number;
  bitrate: number;
}

interface ConnectionQualityIndicatorProps {
  quality: ConnectionQuality;
  className?: string;
}

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  quality,
  className = ''
}) => {
  const getQualityColor = () => {
    switch (quality.level) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'fair': return 'text-orange-400';
      case 'poor': return 'text-red-400';
      case 'disconnected': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityIcon = () => {
    if (quality.level === 'disconnected') {
      return <WifiOff className="w-5 h-5" />;
    }
    return <Signal className="w-5 h-5" />;
  };

  const getSignalBars = () => {
    const bars = [];
    const barCount = quality.level === 'excellent' ? 4 : 
                    quality.level === 'good' ? 3 : 
                    quality.level === 'fair' ? 2 : 
                    quality.level === 'poor' ? 1 : 0;

    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 bg-current rounded-sm ${
            i < barCount ? 'opacity-100' : 'opacity-30'
          }`}
          style={{ height: `${(i + 1) * 3 + 2}px` }}
        />
      );
    }
    return bars;
  };

  if (quality.level === 'disconnected') {
    return null;
  }

  return (
    <div className={`bg-black bg-opacity-75 rounded-lg p-3 text-white ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center gap-1 ${getQualityColor()}`}>
          <div className="flex items-end gap-px">
            {getSignalBars()}
          </div>
          <span className="text-xs font-medium capitalize">
            {quality.level}
          </span>
        </div>
      </div>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Latency:</span>
          <span className={quality.latency > 200 ? 'text-red-400' : 'text-green-400'}>
            {quality.latency}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Loss:</span>
          <span className={quality.packetLoss > 3 ? 'text-red-400' : 'text-green-400'}>
            {quality.packetLoss}%
          </span>
        </div>
        {quality.bitrate > 0 && (
          <div className="flex justify-between">
            <span>Rate:</span>
            <span>{quality.bitrate}KB/s</span>
          </div>
        )}
      </div>
    </div>
  );
};
