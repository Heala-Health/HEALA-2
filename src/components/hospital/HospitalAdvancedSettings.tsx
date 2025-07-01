
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Shield,
  Bell,
  Users,
  Calendar,
  DollarSign,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const HospitalAdvancedSettings: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Hospital Settings
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="operational" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="operational">
          <Card>
            <CardHeader>
              <CardTitle>Operational Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Operating Hours</Label>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="open-time">Opening Time</Label>
                    <Input id="open-time" type="time" defaultValue="06:00" />
                  </div>
                  <div>
                    <Label htmlFor="close-time">Closing Time</Label>
                    <Input id="close-time" type="time" defaultValue="22:00" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Emergency Services</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">24/7 Emergency Services</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trauma Center</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ambulance Services</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Appointment Settings</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="booking-advance">Maximum booking advance (days)</Label>
                    <Input id="booking-advance" type="number" defaultValue="30" className="w-32" />
                  </div>
                  <div>
                    <Label htmlFor="appointment-duration">Default appointment duration (minutes)</Label>
                    <Input id="appointment-duration" type="number" defaultValue="30" className="w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Allow online booking</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require appointment confirmation</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Operational')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Operational Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New appointment notifications</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency alerts</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System maintenance notices</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily reports</span>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">SMS Notifications</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency alerts only</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appointment reminders</span>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time emergency alerts</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System status updates</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Notification Recipients</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="admin-email">Administrator Email</Label>
                    <Input id="admin-email" type="email" defaultValue="admin@hospital.com" />
                  </div>
                  <div>
                    <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                    <Input id="emergency-phone" type="tel" defaultValue="+234-800-123-4567" />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Notification')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Access Control</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require two-factor authentication</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enforce strong passwords</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable IP whitelist</span>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Session Management</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" className="w-32" />
                  </div>
                  <div>
                    <Label htmlFor="max-sessions">Maximum concurrent sessions</Label>
                    <Input id="max-sessions" type="number" defaultValue="3" className="w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-logout on inactivity</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Data Protection</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encrypt sensitive data at rest</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable audit logging</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data loss prevention</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">IP Whitelist</Label>
                <div className="mt-3">
                  <Textarea 
                    placeholder="Enter IP addresses, one per line..."
                    className="min-h-[100px]"
                    defaultValue="192.168.1.0/24&#10;10.0.0.0/8"
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('Security')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Payment Methods</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accept credit cards</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accept bank transfers</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accept mobile payments</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accept insurance</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Billing Configuration</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <select id="currency" className="w-full p-2 border rounded-md">
                      <option value="NGN">Nigerian Naira (NGN)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" defaultValue="7.5" className="w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-generate invoices</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send payment reminders</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Consultation Rates</Label>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="standard-rate">Standard Consultation</Label>
                    <Input id="standard-rate" type="number" defaultValue="15000" />
                  </div>
                  <div>
                    <Label htmlFor="specialist-rate">Specialist Consultation</Label>
                    <Input id="specialist-rate" type="number" defaultValue="25000" />
                  </div>
                  <div>
                    <Label htmlFor="emergency-rate">Emergency Consultation</Label>
                    <Input id="emergency-rate" type="number" defaultValue="35000" />
                  </div>
                  <div>
                    <Label htmlFor="followup-rate">Follow-up Consultation</Label>
                    <Input id="followup-rate" type="number" defaultValue="10000" />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Billing')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Billing Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Role Permissions</Label>
                <div className="mt-3 space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Hospital Administrator</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Full system access</span>
                        <Switch defaultChecked disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Manage physicians</span>
                        <Switch defaultChecked disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View financial reports</span>
                        <Switch defaultChecked disabled />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Physician</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View patient records</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Create prescriptions</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Access scheduling</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View financial data</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Nurse</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View patient records</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Update vital signs</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Access scheduling</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Data Access Controls</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require explicit patient consent for data access</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Log all patient record access</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Restrict access to sensitive records</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Access Control')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Access Control Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Data Backup</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automatic daily backups</span>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <Label htmlFor="backup-time">Backup time</Label>
                    <Input id="backup-time" type="time" defaultValue="02:00" className="w-32" />
                  </div>
                  <div>
                    <Label htmlFor="retention-days">Backup retention (days)</Label>
                    <Input id="retention-days" type="number" defaultValue="30" className="w-32" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">System Maintenance</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="maintenance-window">Maintenance window</Label>
                    <Input id="maintenance-window" defaultValue="Sunday 2:00 AM - 4:00 AM" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-apply security updates</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send maintenance notifications</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Performance Settings</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="cache-duration">Cache duration (hours)</Label>
                    <Input id="cache-duration" type="number" defaultValue="24" className="w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable database optimization</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compress uploaded files</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Integration Settings</Label>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="api-timeout">API timeout (seconds)</Label>
                    <Input id="api-timeout" type="number" defaultValue="30" className="w-32" />
                  </div>
                  <div>
                    <Label htmlFor="webhook-retries">Webhook retry attempts</Label>
                    <Input id="webhook-retries" type="number" defaultValue="3" className="w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable API rate limiting</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('System')} disabled={saving}>
                {saving ? 'Saving...' : 'Save System Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
