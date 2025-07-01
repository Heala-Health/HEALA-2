
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Lock, Eye, AlertTriangle, UserCheck, Activity, Bell, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  ipWhitelistEnabled: boolean;
  auditLoggingEnabled: boolean;
  dataEncryptionEnabled: boolean;
  accessNotificationsEnabled: boolean;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  ip: string;
  status: 'success' | 'warning' | 'danger';
}

export const HospitalSecurityManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorRequired: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    ipWhitelistEnabled: false,
    auditLoggingEnabled: true,
    dataEncryptionEnabled: true,
    accessNotificationsEnabled: true
  });
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [whitelistedIPs, setWhitelistedIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchSecuritySettings();
      fetchSecurityLogs();
    }
  }, [profile?.hospital_id]);

  const fetchSecuritySettings = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('security_settings')
        .eq('id', profile.hospital_id)
        .single();

      if (hospital?.security_settings) {
        const securitySettings = hospital.security_settings as any;
        setSettings({
          twoFactorRequired: securitySettings.two_factor_required || true,
          sessionTimeout: securitySettings.session_timeout || 3600,
          maxLoginAttempts: securitySettings.max_login_attempts || 5,
          ipWhitelistEnabled: securitySettings.ip_whitelist_enabled || false,
          auditLoggingEnabled: securitySettings.audit_logging || true,
          dataEncryptionEnabled: securitySettings.data_encryption || true,
          accessNotificationsEnabled: securitySettings.access_notifications || true
        });
        setWhitelistedIPs(securitySettings.ip_whitelist || []);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      // Generate mock security logs for demonstration
      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          event: 'Admin login',
          user: 'admin@hospital.com',
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          event: 'Failed login attempt',
          user: 'unknown@email.com',
          ip: '203.0.113.42',
          status: 'warning'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          event: 'Data access - Patient records',
          user: 'dr.smith@hospital.com',
          ip: '192.168.1.105',
          status: 'success'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          event: 'Multiple failed login attempts',
          user: 'suspicious@email.com',
          ip: '198.51.100.123',
          status: 'danger'
        }
      ];
      setSecurityLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const updateSecuritySettings = async () => {
    if (!profile?.hospital_id) return;

    setSaving(true);
    try {
      const updatedSettings = {
        two_factor_required: settings.twoFactorRequired,
        session_timeout: settings.sessionTimeout,
        max_login_attempts: settings.maxLoginAttempts,
        ip_whitelist_enabled: settings.ipWhitelistEnabled,
        ip_whitelist: whitelistedIPs,
        audit_logging: settings.auditLoggingEnabled,
        data_encryption: settings.dataEncryptionEnabled,
        access_notifications: settings.accessNotificationsEnabled
      };

      const { error } = await supabase
        .from('hospitals')
        .update({ security_settings: updatedSettings })
        .eq('id', profile.hospital_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Security settings updated successfully.",
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addWhitelistedIP = () => {
    if (newIP && !whitelistedIPs.includes(newIP)) {
      setWhitelistedIPs([...whitelistedIPs, newIP]);
      setNewIP('');
    }
  };

  const removeWhitelistedIP = (ip: string) => {
    setWhitelistedIPs(whitelistedIPs.filter(item => item !== ip));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading security settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-green-600">A+</p>
                <p className="text-xs text-gray-500">Excellent</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-gray-500">Currently online</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Encryption</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
                <p className="text-xs text-gray-500">All data secured</p>
              </div>
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Security Configuration
            </div>
            <Button onClick={updateSecuritySettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={settings.twoFactorRequired}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorRequired: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Whitelist</Label>
                  <p className="text-sm text-gray-600">Restrict access to specific IPs</p>
                </div>
                <Switch
                  checked={settings.ipWhitelistEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, ipWhitelistEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-gray-600">Log all system activities</p>
                </div>
                <Switch
                  checked={settings.auditLoggingEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, auditLoggingEnabled: checked})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Access Notifications</Label>
                  <p className="text-sm text-gray-600">Alert on suspicious activity</p>
                </div>
                <Switch
                  checked={settings.accessNotificationsEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, accessNotificationsEnabled: checked})}
                />
              </div>
            </div>
          </div>

          {/* IP Whitelist Management */}
          {settings.ipWhitelistEnabled && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Whitelisted IP Addresses</h4>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter IP address (e.g., 192.168.1.100)"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
                <Button onClick={addWhitelistedIP}>Add IP</Button>
              </div>
              <div className="space-y-2">
                {whitelistedIPs.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{ip}</span>
                    <Button size="sm" variant="destructive" onClick={() => removeWhitelistedIP(ip)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Security Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                  <div>
                    <p className="font-medium">{log.event}</p>
                    <p className="text-sm text-gray-600">{log.user} from {log.ip}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
