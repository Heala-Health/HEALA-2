
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useConsultationSession } from './hooks/useConsultationSession';
import { ConsultationSessionHeader } from './ConsultationSessionHeader';
import { VideoInterface } from './VideoInterface';
import { SessionSummary } from './SessionSummary';
import { EmptySessionState } from './EmptySessionState';
import { SessionList } from './SessionList';
import { TestVideoSession } from './TestVideoSession';
import { VirtualConsultationRoomProps } from './types';

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId: initialSessionId }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
  
  const {
    session,
    loading,
    sessionDuration,
    connectionStatus,
    startSession,
    endSession,
    formatDuration
  } = useConsultationSession(currentSessionId);

  // Update URL when session changes without reloading
  useEffect(() => {
    if (currentSessionId) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('session', currentSessionId);
      window.history.pushState({}, '', currentUrl.toString());
    } else {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('session');
      window.history.pushState({}, '', currentUrl.toString());
    }
  }, [currentSessionId]);

  const handleSelectSession = (selectedSessionId: string) => {
    console.log('Selecting session:', selectedSessionId);
    setCurrentSessionId(selectedSessionId);
  };

  const handleBackToList = () => {
    setCurrentSessionId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading consultation room...</div>
        </CardContent>
      </Card>
    );
  }

  // If no session is selected, show the session list
  if (!currentSessionId) {
    return (
      <div className="space-y-6">
        <TestVideoSession />
        <SessionList onSelectSession={handleSelectSession} />
        <EmptySessionState />
      </div>
    );
  }

  // If session ID is provided but no session found
  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Session not found or access denied.</p>
            <button 
              onClick={handleBackToList}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to session list
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={handleBackToList}
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          ← Back to sessions
        </button>
      </div>

      <ConsultationSessionHeader
        session={session}
        connectionStatus={connectionStatus}
        sessionDuration={sessionDuration}
        formatDuration={formatDuration}
      />

      <VideoInterface
        session={session}
        onStartSession={startSession}
        onEndSession={endSession}
      />

      <SessionSummary
        session={session}
        formatDuration={formatDuration}
      />
    </div>
  );
};
