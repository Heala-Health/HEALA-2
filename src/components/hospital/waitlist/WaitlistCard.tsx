
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone } from 'lucide-react';
import { WaitlistEntry } from './types';
import { getPriorityColor, getStatusColor } from './utils';

interface WaitlistCardProps {
  entry: WaitlistEntry;
  onUpdateStatus: (entryId: string, newStatus: string) => void;
}

export const WaitlistCard: React.FC<WaitlistCardProps> = ({ entry, onUpdateStatus }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-medium">{entry.patient_name}</h4>
            <p className="text-sm text-gray-600">{entry.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(entry.priority)}>
            {entry.priority}
          </Badge>
          <Badge className={getStatusColor(entry.status)}>
            {entry.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Reason</p>
          <p className="text-sm">{entry.reason}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Estimated Wait</p>
          <p className="text-sm">{entry.estimated_wait_time} minutes</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Arrival Time</p>
          <p className="text-sm">{new Date(entry.created_at).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {entry.status === 'waiting' && (
          <>
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(entry.id, 'called')}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call Patient
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(entry.id, 'in_progress')}
            >
              Start Treatment
            </Button>
          </>
        )}
        {entry.status === 'called' && (
          <Button 
            size="sm" 
            onClick={() => onUpdateStatus(entry.id, 'in_progress')}
          >
            Start Treatment
          </Button>
        )}
        {entry.status === 'in_progress' && (
          <Button 
            size="sm" 
            onClick={() => onUpdateStatus(entry.id, 'completed')}
          >
            Mark Complete
          </Button>
        )}
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onUpdateStatus(entry.id, 'cancelled')}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
