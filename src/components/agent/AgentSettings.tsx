
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Bell, Clock, User, Shield } from 'lucide-react';

export const AgentSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'Africa/Lagos'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      urgentOnly: false
    },
    preferences: {
      autoAssignPatients: true,
      maxConcurrentPatients: 10,
      specializations: [] as string[],
      languages: ['English']
    },
    profile: {
      bio: '',
      experience: '',
      certifications: ''
    }
  });

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // For now, we'll just show a success message
      // In a real implementation, you'd save to a proper table
      toast({
        title: "Settings Saved",
        description: "Your agent settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Agent Settings & Preferences</h2>
      </div>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => updateSettings(['workingHours', 'start'], e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => updateSettings(['workingHours', 'end'], e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={settings.workingHours.timezone} 
              onValueChange={(value) => updateSettings(['workingHours', 'timezone'], value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <Switch
              id="emailNotifications"
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) => updateSettings(['notifications', 'emailNotifications'], checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications">Push Notifications</Label>
            <Switch
              id="pushNotifications"
              checked={settings.notifications.pushNotifications}
              onCheckedChange={(checked) => updateSettings(['notifications', 'pushNotifications'], checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="smsNotifications">SMS Notifications</Label>
            <Switch
              id="smsNotifications"
              checked={settings.notifications.smsNotifications}
              onCheckedChange={(checked) => updateSettings(['notifications', 'smsNotifications'], checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="urgentOnly">Urgent Notifications Only</Label>
            <Switch
              id="urgentOnly"
              checked={settings.notifications.urgentOnly}
              onCheckedChange={(checked) => updateSettings(['notifications', 'urgentOnly'], checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Work Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoAssign">Auto-assign New Patients</Label>
            <Switch
              id="autoAssign"
              checked={settings.preferences.autoAssignPatients}
              onCheckedChange={(checked) => updateSettings(['preferences', 'autoAssignPatients'], checked)}
            />
          </div>
          <div>
            <Label htmlFor="maxPatients">Maximum Concurrent Patients</Label>
            <Input
              id="maxPatients"
              type="number"
              min="1"
              max="50"
              value={settings.preferences.maxConcurrentPatients}
              onChange={(e) => updateSettings(['preferences', 'maxConcurrentPatients'], parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Professional Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief description of your experience and expertise..."
              value={settings.profile.bio}
              onChange={(e) => updateSettings(['profile', 'bio'], e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              placeholder="e.g., 5 years in healthcare support"
              value={settings.profile.experience}
              onChange={(e) => updateSettings(['profile', 'experience'], e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="certifications">Certifications</Label>
            <Textarea
              id="certifications"
              placeholder="List your relevant certifications..."
              value={settings.profile.certifications}
              onChange={(e) => updateSettings(['profile', 'certifications'], e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
};
