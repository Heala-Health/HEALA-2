
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Zap,
  Database,
  Cloud,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Key,
  Webhook,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'cloud_service';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  provider: string;
  description: string;
  lastSync?: string;
  apiCalls24h?: number;
  isEnabled: boolean;
  configuration: Record<string, any>;
}

interface APIEndpoint {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'active' | 'inactive';
  lastCalled?: string;
  callsToday: number;
}

export const HospitalIntegrationManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
    fetchAPIEndpoints();
  }, []);

  const fetchIntegrations = async () => {
    try {
      // Mock data for demonstration
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Electronic Health Records',
          type: 'api',
          status: 'connected',
          provider: 'Epic Systems',
          description: 'Integration with hospital EHR system for patient data synchronization',
          lastSync: '2024-06-15T10:30:00Z',
          apiCalls24h: 2450,
          isEnabled: true,
          configuration: {
            apiKey: '••••••••••••1234',
            baseUrl: 'https://api.epic.com/v1',
            syncInterval: 15
          }
        },
        {
          id: '2',
          name: 'Laboratory Information System',
          type: 'webhook',
          status: 'connected',
          provider: 'Cerner',
          description: 'Real-time lab results and test ordering integration',
          lastSync: '2024-06-15T09:15:00Z',
          apiCalls24h: 890,
          isEnabled: true,
          configuration: {
            webhookUrl: 'https://our-hospital.com/webhooks/lab-results',
            secretKey: '••••••••••••5678'
          }
        },
        {
          id: '3',
          name: 'Pharmacy Management',
          type: 'api',
          status: 'error',
          provider: 'CVS Health',
          description: 'Prescription management and drug inventory integration',
          lastSync: '2024-06-14T16:45:00Z',
          apiCalls24h: 156,
          isEnabled: false,
          configuration: {
            apiKey: '••••••••••••9012',
            environment: 'production'
          }
        },
        {
          id: '4',
          name: 'Insurance Verification',
          type: 'cloud_service',
          status: 'connected',
          provider: 'Availity',
          description: 'Real-time insurance eligibility and benefits verification',
          lastSync: '2024-06-15T11:00:00Z',
          apiCalls24h: 1250,
          isEnabled: true,
          configuration: {
            clientId: '••••••••••••3456',
            region: 'us-east-1'
          }
        },
        {
          id: '5',
          name: 'Imaging System',
          type: 'database',
          status: 'pending',
          provider: 'GE Healthcare',
          description: 'PACS integration for medical imaging and radiology reports',
          isEnabled: false,
          configuration: {
            connectionString: '••••••••••••••••',
            port: 5432
          }
        }
      ];
      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchAPIEndpoints = async () => {
    try {
      // Mock API endpoints data
      const mockEndpoints: APIEndpoint[] = [
        {
          id: '1',
          name: 'Patient Data Sync',
          endpoint: '/api/v1/patients/sync',
          method: 'POST',
          status: 'active',
          lastCalled: '2024-06-15T10:30:00Z',
          callsToday: 245
        },
        {
          id: '2',
          name: 'Lab Results Webhook',
          endpoint: '/api/v1/lab-results',
          method: 'POST',
          status: 'active',
          lastCalled: '2024-06-15T09:15:00Z',
          callsToday: 89
        },
        {
          id: '3',
          name: 'Appointment Notifications',
          endpoint: '/api/v1/notifications/appointments',
          method: 'POST',
          status: 'active',
          lastCalled: '2024-06-15T11:45:00Z',
          callsToday: 156
        }
      ];
      setApiEndpoints(mockEndpoints);
    } catch (error) {
      console.error('Error fetching API endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = (integrationId: string, enabled: boolean) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, isEnabled: enabled, status: enabled ? 'connected' : 'disconnected' }
        : integration
    ));
    
    toast({
      title: enabled ? "Integration Enabled" : "Integration Disabled",
      description: `Integration has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
    });
  };

  const testConnection = (integrationId: string) => {
    toast({
      title: "Testing Connection",
      description: "Connection test initiated...",
    });
    
    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection Test Complete",
        description: "Connection is working properly.",
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api': return <Zap className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'cloud_service': return <Cloud className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Calls (24h)</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + (i.apiCalls24h || 0), 0).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(integration.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={getStatusColor(integration.status)}>
                            {getStatusIcon(integration.status)}
                            <span className="ml-1">{integration.status}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">Provider: {integration.provider}</span>
                          {integration.lastSync && (
                            <span className="text-xs text-gray-500">
                              Last sync: {new Date(integration.lastSync).toLocaleString()}
                            </span>
                          )}
                          {integration.apiCalls24h && (
                            <span className="text-xs text-gray-500">
                              {integration.apiCalls24h} calls today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.isEnabled}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                      />
                      <Button size="sm" variant="outline" onClick={() => testConnection(integration.id)}>
                        Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div key={endpoint.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{endpoint.method}</Badge>
                        <span className="font-mono text-sm">{endpoint.endpoint}</span>
                        <Badge className={endpoint.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {endpoint.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{endpoint.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {endpoint.callsToday} calls today
                        </span>
                        {endpoint.lastCalled && (
                          <span className="text-xs text-gray-500">
                            Last called: {new Date(endpoint.lastCalled).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Logs
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Incoming Webhooks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lab Results Webhook</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <code className="text-xs text-gray-600 block">
                      https://hospital.example.com/webhooks/lab-results
                    </code>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Outgoing Webhooks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Patient Admission Notifications</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <code className="text-xs text-gray-600 block">
                      https://external-system.example.com/patient-admissions
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Security Settings</Label>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require API key authentication</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Enable webhook signature verification</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Log all API requests</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Rate Limiting</Label>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="rate-limit">Requests per minute</Label>
                      <Input id="rate-limit" defaultValue="1000" className="w-32" />
                    </div>
                    <div>
                      <Label htmlFor="burst-limit">Burst limit</Label>
                      <Input id="burst-limit" defaultValue="100" className="w-32" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Data Sync Settings</Label>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="sync-interval">Default sync interval (minutes)</Label>
                      <Input id="sync-interval" defaultValue="15" className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-retry failed syncs</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
