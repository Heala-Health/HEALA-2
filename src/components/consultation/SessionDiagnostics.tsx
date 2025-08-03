
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionAnalytics } from './hooks/useSessionAnalytics';
import { useSessionRecovery } from './hooks/useSessionRecovery';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SessionDiagnosticsProps {
  sessionId?: string;
  onClose?: () => void;
}

export const SessionDiagnostics: React.FC<SessionDiagnosticsProps> = ({
  sessionId,
  onClose
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error' | 'checking'>('checking');

  const analytics = useSessionAnalytics(user?.id);
  const { checkSessionHealth, recoverSession, isRecovering } = useSessionRecovery();

  useEffect(() => {
    if (sessionId) {
      performHealthCheck();
    }
  }, [sessionId]);

  const performHealthCheck = async () => {
    if (!sessionId) return;
    
    setHealthStatus('checking');
    try {
      const isHealthy = await checkSessionHealth(sessionId);
      setHealthStatus(isHealthy ? 'healthy' : 'warning');
    } catch (error) {
      setHealthStatus('error');
    }
  };

  const handleRecoverSession = async () => {
    if (!sessionId || !user?.id) return;
    
    try {
      await recoverSession(sessionId, user.id);
      await performHealthCheck();
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  };

  const getHealthStatusBadge = () => {
    switch (healthStatus) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'checking':
        return <Badge variant="outline"><Activity className="w-3 h-3 mr-1 animate-spin" />Checking</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Session Diagnostics
        </CardTitle>
        <div className="flex items-center gap-2">
          {sessionId && getHealthStatusBadge()}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="health">Health Check</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{analytics.metrics.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">{analytics.metrics.completedSessions}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">{analytics.metrics.failedSessions}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{analytics.metrics.successRate}%</div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{session.session_type} session</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={session.status === 'completed' ? 'default' : 
                                session.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Health Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current Status:</span>
                  {getHealthStatusBadge()}
                </div>
                
                <Button 
                  onClick={performHealthCheck} 
                  disabled={healthStatus === 'checking'}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Run Health Check
                </Button>

                {healthStatus === 'warning' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      Session has some issues that may affect performance. Consider running recovery.
                    </p>
                  </div>
                )}

                {healthStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      Session has critical issues. Recovery is recommended.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Recovery can fix common session issues like missing consultation rooms, 
                  broken connections, or inconsistent states.
                </p>

                <Button 
                  onClick={handleRecoverSession}
                  disabled={!sessionId || isRecovering}
                  className="w-full"
                  variant={healthStatus === 'error' ? 'destructive' : 'default'}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                  {isRecovering ? 'Recovering Session...' : 'Recover Session'}
                </Button>

                {isRecovering && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      Recovery in progress. This may take a few moments...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
