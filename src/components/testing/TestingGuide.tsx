
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Users, Calendar, MessageSquare, AlertTriangle, UserCheck, Activity } from 'lucide-react';

interface TestStep {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  completed: boolean;
}

export const TestingGuide: React.FC = () => {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());

  const markTestComplete = (testId: string) => {
    setCompletedTests(prev => new Set([...prev, testId]));
  };

  const authTests: TestStep[] = [
    {
      id: 'auth-patient',
      title: 'Patient Registration & Login',
      description: 'Test patient user flow',
      steps: [
        'Go to /auth/register',
        'Fill form with role "Patient"',
        'Complete registration',
        'Login and verify dashboard access'
      ],
      expectedResult: 'Patient should access PatientDashboard with booking features',
      completed: completedTests.has('auth-patient')
    },
    {
      id: 'auth-physician',
      title: 'Physician Registration & Login',
      description: 'Test physician user flow',
      steps: [
        'Register as Physician with specialization',
        'Add license number',
        'Login and check dashboard',
        'Verify physician features are available'
      ],
      expectedResult: 'Physician should access PhysicianDashboard',
      completed: completedTests.has('auth-physician')
    },
    {
      id: 'auth-hospital',
      title: 'Hospital Admin Registration',
      description: 'Test hospital admin flow',
      steps: [
        'Register as Hospital Admin',
        'Login and access dashboard',
        'Verify hospital management features'
      ],
      expectedResult: 'Hospital admin should access HospitalDashboard',
      completed: completedTests.has('auth-hospital')
    },
    {
      id: 'auth-agent',
      title: 'Agent Registration',
      description: 'Test agent user flow',
      steps: [
        'Register as Agent',
        'Login and access dashboard',
        'Verify agent booking features'
      ],
      expectedResult: 'Agent should access AgentDashboard',
      completed: completedTests.has('auth-agent')
    }
  ];

  const bookingTests: TestStep[] = [
    {
      id: 'booking-basic',
      title: 'Basic Appointment Booking',
      description: 'Test the appointment booking flow',
      steps: [
        'Login as a patient',
        'Go to "Book New" tab',
        'Enter location and search physicians',
        'Select a physician and book appointment'
      ],
      expectedResult: 'Appointment should be created and appear in appointments list',
      completed: completedTests.has('booking-basic')
    },
    {
      id: 'booking-limit',
      title: 'Monthly Booking Limit',
      description: 'Test 3 bookings/month limit for basic plan',
      steps: [
        'As basic plan patient, book 3 appointments',
        'Try to book a 4th appointment',
        'Verify limit enforcement'
      ],
      expectedResult: 'Should prevent 4th booking and show upgrade message',
      completed: completedTests.has('booking-limit')
    }
  ];

  const realtimeTests: TestStep[] = [
    {
      id: 'realtime-chat',
      title: 'Real-time Chat',
      description: 'Test chat message delivery',
      steps: [
        'Open two browser tabs',
        'Login as patient in one, physician in another',
        'Start a conversation',
        'Send messages from both sides'
      ],
      expectedResult: 'Messages should appear instantly in both tabs',
      completed: completedTests.has('realtime-chat')
    },
    {
      id: 'realtime-emergency',
      title: 'Emergency Notifications',
      description: 'Test ambulance request notifications',
      steps: [
        'Open multiple tabs',
        'Submit ambulance request as patient',
        'Check for notifications in other tabs'
      ],
      expectedResult: 'Emergency notifications should appear across all sessions',
      completed: completedTests.has('realtime-emergency')
    }
  ];

  const emergencyTests: TestStep[] = [
    {
      id: 'emergency-request',
      title: 'Ambulance Request',
      description: 'Test emergency service request',
      steps: [
        'Go to Emergency tab',
        'Fill ambulance request form',
        'Submit request',
        'Check status updates'
      ],
      expectedResult: 'Request should be created and status should be trackable',
      completed: completedTests.has('emergency-request')
    }
  ];

  const TestSection: React.FC<{ title: string; tests: TestStep[]; icon: React.ReactNode }> = ({ title, tests, icon }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary">
            {tests.filter(t => t.completed).length}/{tests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{test.title}</h4>
              {test.completed && <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600 mb-3">{test.description}</p>
            
            <div className="mb-3">
              <h5 className="text-sm font-medium mb-1">Steps:</h5>
              <ol className="text-sm space-y-1">
                {test.steps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-500">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Expected:</strong> {test.expectedResult}
              </AlertDescription>
            </Alert>
            
            {!test.completed && (
              <Button 
                size="sm" 
                onClick={() => markTestComplete(test.id)}
                className="mt-3"
              >
                Mark as Completed
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const allTests = [...authTests, ...bookingTests, ...realtimeTests, ...emergencyTests];
  const completedCount = allTests.filter(t => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Testing Guide</h1>
        <p className="text-gray-600 mb-4">
          Follow these tests to verify all application features work correctly
        </p>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Progress: {completedCount}/{allTests.length} tests completed
          </Badge>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / allTests.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="auth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="booking">Appointments</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="auth">
          <TestSection 
            title="Authentication Tests" 
            tests={authTests} 
            icon={<Users className="w-5 h-5" />}
          />
        </TabsContent>

        <TabsContent value="booking">
          <TestSection 
            title="Appointment Booking Tests" 
            tests={bookingTests} 
            icon={<Calendar className="w-5 h-5" />}
          />
        </TabsContent>

        <TabsContent value="realtime">
          <TestSection 
            title="Real-time Feature Tests" 
            tests={realtimeTests} 
            icon={<MessageSquare className="w-5 h-5" />}
          />
        </TabsContent>

        <TabsContent value="emergency">
          <TestSection 
            title="Emergency Service Tests" 
            tests={emergencyTests} 
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
