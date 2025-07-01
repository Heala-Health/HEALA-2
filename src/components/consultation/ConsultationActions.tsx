
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, UserCheck, Play } from 'lucide-react';

interface ConsultationActionsProps {
  sessionStatus: string;
  isPhysician: boolean;
  isPatient: boolean;
  consultationStarted: boolean;
  showJoinButton: boolean;
  isCallActive: boolean;
  autoJoinAttempted: boolean;
  onStartConsultation: () => void;
  onPatientJoin: () => void;
  onStartCall: () => void;
  onEnableManualJoin: () => void;
}

export const ConsultationActions: React.FC<ConsultationActionsProps> = ({
  sessionStatus,
  isPhysician,
  isPatient,
  consultationStarted,
  showJoinButton,
  isCallActive,
  onStartConsultation,
  onPatientJoin,
  onStartCall
}) => {
  console.log('🎬 [ConsultationActions] Current state:', {
    sessionStatus,
    isPhysician,
    isPatient,
    consultationStarted,
    showJoinButton,
    isCallActive,
    timestamp: new Date().toISOString()
  });

  // For patients - always show "Enter Video Call" button regardless of session status
  if (isPatient) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 max-w-md">
          <Video className="w-20 h-20 mx-auto mb-6 text-green-500 animate-pulse" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🎥 Video Consultation Ready
          </h3>
          <p className="text-gray-600 mb-6">
            Click below to enter the video consultation room and connect with your doctor.
          </p>
          <Button
            onClick={() => {
              console.log('🔘 [ConsultationActions] Patient entering video call directly');
              onPatientJoin();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg w-full animate-pulse"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Enter Video Call
          </Button>
          <p className="text-xs text-green-600 mt-4">
            🎥 Your camera and microphone will be activated
          </p>
          <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Session Status: {sessionStatus} | Ready to connect
          </div>
        </div>
      </div>
    );
  }

  // Session not started yet - Physician needs to start
  if (sessionStatus === 'scheduled') {
    console.log('🎬 [ConsultationActions] Session scheduled - showing start options');
    
    if (isPhysician) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-blue-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Video Consultation</h3>
            <p className="text-gray-600 mb-6">
              Start the video consultation to allow the patient to join
            </p>
            <Button
              onClick={() => {
                console.log('🔘 [ConsultationActions] Physician starting consultation');
                onStartConsultation();
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg w-full"
              size="lg"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Start Video Consultation
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              This will notify the patient and enable video calling
            </p>
          </div>
        </div>
      );
    }
  }

  // Session in progress - Physician can start video
  if (sessionStatus === 'in_progress') {
    console.log('🎬 [ConsultationActions] Session in progress - showing physician start options');
    
    if (isPhysician) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Start Your Video Call
            </h3>
            <p className="text-gray-600 mb-6">
              The consultation is active. Start your video call when ready.
            </p>
            <Button
              onClick={() => {
                console.log('🔘 [ConsultationActions] Physician starting video call');
                onStartCall();
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg w-full"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Video Call
            </Button>
            <p className="text-xs text-green-600 mt-4">
              Patient can join anytime
            </p>
          </div>
        </div>
      );
    }
  }

  // Fallback state
  console.log('🎬 [ConsultationActions] No matching state found, showing fallback');
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-gray-200 max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Session State Unknown</h3>
        <p className="text-gray-600 mb-4">
          Status: {sessionStatus} | Role: {isPhysician ? 'Physician' : 'Patient'}
        </p>
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Debug: consultationStarted={consultationStarted ? 'true' : 'false'}, 
          showJoinButton={showJoinButton ? 'true' : 'false'}, 
          isCallActive={isCallActive ? 'true' : 'false'}
        </div>
      </div>
    </div>
  );
};
