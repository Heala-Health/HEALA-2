
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, MessageCircle, Video } from 'lucide-react';
import { ConsultationSession } from './types';

interface IncomingCallDialogProps {
  isOpen: boolean;
  session: ConsultationSession;
  callerName: string;
  onAnswer: () => void;
  onDecline: () => void;
  onMessage: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  isOpen,
  session,
  callerName,
  onAnswer,
  onDecline,
  onMessage
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 p-6">
          {/* Caller Info */}
          <div className="space-y-4">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Incoming Video Call
              </h2>
              <p className="text-gray-600 mt-1">
                {callerName} is calling for virtual consultation
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Session: {session.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Call Actions */}
          <div className="flex justify-center items-center gap-6">
            {/* Decline Button */}
            <Button
              onClick={onDecline}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* Message Button */}
            <Button
              onClick={onMessage}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            {/* Answer Button */}
            <Button
              onClick={onAnswer}
              className="bg-green-600 hover:bg-green-700 rounded-full w-16 h-16 p-0"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            You can answer, decline, or send a message
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
