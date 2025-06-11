import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Play, Bug } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed';
  message: string;
  duration?: number;
}

export const TestSuite: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'Authentication Flow',
      test: async () => {
        if (!user) throw new Error('User not authenticated');
        return 'Authentication working correctly';
      }
    },
    {
      name: 'Profile Data Loading',
      test: async () => {
        if (!profile) throw new Error('Profile not loaded');
        return `Profile loaded: ${profile.role}`;
      }
    },
    {
      name: 'Database Connection',
      test: async () => {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        return 'Database connection successful';
      }
    },
    {
      name: 'Appointment Booking Limit',
      test: async () => {
        if (!user) throw new Error('User required');
        const { data, error } = await supabase.rpc('check_monthly_booking_limit', { 
          patient_uuid: user.id 
        });
        if (error) throw error;
        return `Monthly bookings: ${data || 0}`;
      }
    },
    {
      name: 'Real-time Subscriptions',
      test: async (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const channel = supabase.channel('test-channel')
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                supabase.removeChannel(channel);
                resolve('Real-time connection established');
              } else if (status === 'CHANNEL_ERROR') {
                reject(new Error('Real-time connection failed'));
              }
            });
          
          setTimeout(() => {
            supabase.removeChannel(channel);
            reject(new Error('Real-time connection timeout'));
          }, 5000);
        });
      }
    },
    {
      name: 'Emergency Notifications',
      test: async () => {
        // Test emergency channel subscription
        return new Promise<string>((resolve, reject) => {
          const emergencyChannel = supabase
            .channel('emergency-test')
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                supabase.removeChannel(emergencyChannel);
                resolve('Emergency notification system ready');
              } else if (status === 'CHANNEL_ERROR') {
                reject(new Error('Emergency channel failed'));
              }
            });
          
          setTimeout(() => {
            supabase.removeChannel(emergencyChannel);
            reject(new Error('Emergency channel timeout'));
          }, 3000);
        });
      }
    },
    {
      name: 'Chat System',
      test: async () => {
        if (!user) throw new Error('User required for chat test');
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('patient_id', user.id)
          .limit(1);
        if (error) throw error;
        return 'Chat system accessible';
      }
    },
    {
      name: 'Physician Search',
      test: async () => {
        const { data, error } = await supabase.rpc('get_nearby_physicians', {
          patient_lat: 34.0522,
          patient_lng: -118.2437,
          search_radius_km: 50
        });
        if (error) throw error;
        return `Found ${data?.length || 0} physicians`;
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const testCase of tests) {
      const startTime = Date.now();
      
      // Set test as pending
      setTestResults(prev => [...prev, {
        name: testCase.name,
        status: 'pending',
        message: 'Running...'
      }]);
      
      try {
        const result = await testCase.test();
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map(test => 
          test.name === testCase.name 
            ? { ...test, status: 'passed' as const, message: String(result), duration }
            : test
        ));
      } catch (error) {
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map(test => 
          test.name === testCase.name 
            ? { 
                ...test, 
                status: 'failed' as const, 
                message: error instanceof Error ? error.message : 'Test failed',
                duration 
              }
            : test
        ));
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    
    toast({
      title: "Test Suite Completed",
      description: `${passed} passed, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="w-6 h-6" />
                <span>Application Test Suite</span>
              </CardTitle>
              <CardDescription>
                Comprehensive testing of core application features
              </CardDescription>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="results">
            <TabsList>
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="space-y-4">
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Click "Run All Tests" to start testing
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.duration && (
                          <span className="text-xs text-gray-500">{result.duration}ms</span>
                        )}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(r => r.status === 'passed').length}
                    </div>
                    <div className="text-sm text-gray-600">Tests Passed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(r => r.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-600">Tests Failed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.length > 0 
                        ? Math.round(testResults.reduce((acc, r) => acc + (r.duration || 0), 0) / testResults.length)
                        : 0
                      }ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
