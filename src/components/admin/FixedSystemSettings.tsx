
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
}

export const FixedSystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);

      // Find AI API key setting and properly access the key property
      const aiKeySetting = data?.find(s => s.setting_key === 'ai_api_key');
      if (aiKeySetting && typeof aiKeySetting.setting_value === 'object' && aiKeySetting.setting_value !== null) {
        const settingValue = aiKeySetting.setting_value as { key?: string };
        setAiApiKey(settingValue.key || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveAiApiKey = async () => {
    if (!aiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'ai_api_key',
          setting_value: { key: aiApiKey },
          category: 'ai',
          description: 'API key for AI services'
        });

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_type_param: 'system_setting_update',
        action_details_param: {
          setting_key: 'ai_api_key',
          action: 'updated'
        }
      });

      toast({
        title: "Success",
        description: "AI API key saved successfully.",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving AI API key:', error);
      toast({
        title: "Error",
        description: "Failed to save AI API key.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">AI API Key</label>
            <Input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="Enter AI API key..."
            />
          </div>
          <Button onClick={saveAiApiKey} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings ({settings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{setting.setting_key}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
                <p className="text-xs text-gray-500 mt-1">Category: {setting.category}</p>
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <pre>{JSON.stringify(setting.setting_value, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
