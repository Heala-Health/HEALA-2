
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Key, Database, Shield, Globe, Mail, Bell } from 'lucide-react';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
  is_active: boolean;
}

interface AIApiSetting {
  key: string;
  provider: string;
}

export const AdminSystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
      
      // Extract AI API key settings with proper type checking
      const aiSetting = data?.find(s => s.setting_key === 'ai_api_key');
      if (aiSetting && aiSetting.setting_value && typeof aiSetting.setting_value === 'object' && !Array.isArray(aiSetting.setting_value)) {
        const aiValue = aiSetting.setting_value as unknown as AIApiSetting;
        if (aiValue && typeof aiValue === 'object' && 'key' in aiValue && 'provider' in aiValue) {
          setAiApiKey(aiValue.key || '');
          setAiProvider(aiValue.provider || 'openai');
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    }
  };

  const saveAiApiKey = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'ai_api_key',
          setting_value: { key: aiApiKey, provider: aiProvider },
          category: 'ai',
          description: 'AI API key configuration'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI API key has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving AI API key:', error);
      toast({
        title: "Error",
        description: "Failed to save AI API key.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: any) => {
    try {
      const setting = settings.find(s => s.setting_key === settingKey);
      if (!setting) return;

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.setting_key === settingKey 
          ? { ...s, setting_value: value }
          : s
      ));

      toast({
        title: "Setting Updated",
        description: `${settingKey} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive"
      });
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const getSettingValue = (key: string, defaultValue: any = '') => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value ?? defaultValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-bold">System Settings</h2>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="aiApiKey">API Key</Label>
            <Input
              id="aiApiKey"
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="Enter your AI API key"
            />
          </div>
          <Button onClick={saveAiApiKey} disabled={loading}>
            {loading ? 'Saving...' : 'Save AI API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication Required</Label>
                <p className="text-sm text-gray-600">Require 2FA for all admin users</p>
              </div>
              <Switch
                checked={getSettingValue('require_2fa', false)}
                onCheckedChange={(checked) => updateSetting('require_2fa', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout (minutes)</Label>
                <p className="text-sm text-gray-600">Auto-logout inactive users</p>
              </div>
              <Input
                type="number"
                className="w-24"
                value={getSettingValue('session_timeout', 60)}
                onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            System Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="systemName">System Name</Label>
            <Input
              id="systemName"
              value={getSettingValue('system_name', 'Heala')}
              onChange={(e) => updateSetting('system_name', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <Switch
              checked={getSettingValue('maintenance_mode', false)}
              onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
