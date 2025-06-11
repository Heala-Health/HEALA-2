import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Bell, Shield, Accessibility } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  appointments: boolean;
  prescriptions: boolean;
  emergency_alerts: boolean;
  health_reminders: boolean;
}

interface UserPreferences {
  id?: string;
  user_id: string;
  language: string;
  font_size: string;
  high_contrast: boolean;
  text_to_speech: boolean;
  biometric_login_enabled: boolean;
  notification_preferences: NotificationPreferences;
}

export const PatientSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: user?.id || '',
    language: 'en',
    font_size: 'medium',
    high_contrast: false,
    text_to_speech: false,
    biometric_login_enabled: false,
    notification_preferences: {
      appointments: true,
      prescriptions: true,
      emergency_alerts: true,
      health_reminders: true,
    }
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Helper function to validate and convert notification preferences
        const validateNotificationPreferences = (prefs: any): NotificationPreferences => {
          if (typeof prefs === 'object' && prefs !== null && !Array.isArray(prefs)) {
            return {
              appointments: Boolean(prefs.appointments ?? true),
              prescriptions: Boolean(prefs.prescriptions ?? true),
              emergency_alerts: Boolean(prefs.emergency_alerts ?? true),
              health_reminders: Boolean(prefs.health_reminders ?? true),
            };
          }
          // Return default values if data is invalid
          return {
            appointments: true,
            prescriptions: true,
            emergency_alerts: true,
            health_reminders: true,
          };
        };

        setPreferences({
          ...data,
          notification_preferences: validateNotificationPreferences(data.notification_preferences)
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load user preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: preferences.user_id,
          language: preferences.language,
          font_size: preferences.font_size,
          high_contrast: preferences.high_contrast,
          text_to_speech: preferences.text_to_speech,
          biometric_login_enabled: preferences.biometric_login_enabled,
          notification_preferences: preferences.notification_preferences as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotificationPreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={preferences.language || 'en'} onValueChange={(value) => updatePreference('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="font_size">Font Size</Label>
              <Select value={preferences.font_size || 'medium'} onValueChange={(value) => updatePreference('font_size', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="w-5 h-5" />
            Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>High Contrast Mode</Label>
              <p className="text-sm text-gray-500">Improve visibility with high contrast colors</p>
            </div>
            <Switch
              checked={preferences.high_contrast}
              onCheckedChange={(checked) => updatePreference('high_contrast', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Text-to-Speech</Label>
              <p className="text-sm text-gray-500">Enable audio reading of content</p>
            </div>
            <Switch
              checked={preferences.text_to_speech}
              onCheckedChange={(checked) => updatePreference('text_to_speech', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Biometric Login</Label>
              <p className="text-sm text-gray-500">Use fingerprint or face ID to log in</p>
            </div>
            <Switch
              checked={preferences.biometric_login_enabled}
              onCheckedChange={(checked) => updatePreference('biometric_login_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
            </div>
            <Switch
              checked={preferences.notification_preferences.appointments}
              onCheckedChange={(checked) => updateNotificationPreference('appointments', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Prescription Alerts</Label>
              <p className="text-sm text-gray-500">Notifications for prescription updates</p>
            </div>
            <Switch
              checked={preferences.notification_preferences.prescriptions}
              onCheckedChange={(checked) => updateNotificationPreference('prescriptions', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Emergency Alerts</Label>
              <p className="text-sm text-gray-500">Critical health and emergency notifications</p>
            </div>
            <Switch
              checked={preferences.notification_preferences.emergency_alerts}
              onCheckedChange={(checked) => updateNotificationPreference('emergency_alerts', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Health Reminders</Label>
              <p className="text-sm text-gray-500">Medication and health check reminders</p>
            </div>
            <Switch
              checked={preferences.notification_preferences.health_reminders}
              onCheckedChange={(checked) => updateNotificationPreference('health_reminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
