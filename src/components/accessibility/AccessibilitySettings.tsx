import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Eye, Volume2, Type, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  id?: string;
  user_id?: string;
  language: string;
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  high_contrast: boolean;
  text_to_speech: boolean;
  biometric_login_enabled: boolean;
  notification_preferences: any;
  created_at?: string;
  updated_at?: string;
}

export const AccessibilitySettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    font_size: 'medium',
    high_contrast: false,
    text_to_speech: false,
    biometric_login_enabled: false,
    notification_preferences: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
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
        setPreferences({
          language: data.language || 'en',
          font_size: (data.font_size as 'small' | 'medium' | 'large' | 'extra_large') || 'medium',
          high_contrast: data.high_contrast || false,
          text_to_speech: data.text_to_speech || false,
          biometric_login_enabled: data.biometric_login_enabled || false,
          notification_preferences: data.notification_preferences || {}
        });
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
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
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Apply settings immediately
      applyAccessibilitySettings();

      toast({
        title: "Settings Saved",
        description: "Your accessibility preferences have been updated."
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const applyAccessibilitySettings = () => {
    const root = document.documentElement;

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      extra_large: '22px'
    };
    root.style.fontSize = fontSizeMap[preferences.font_size];

    // Apply high contrast
    if (preferences.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  const speakText = (text: string) => {
    if (preferences.text_to_speech && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferences.language === 'yo' ? 'yo-NG' : 
                      preferences.language === 'ha' ? 'ha-NG' : 
                      preferences.language === 'ig' ? 'ig-NG' : 'en-NG';
      speechSynthesis.speak(utterance);
    }
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'yo', label: 'Yoruba' },
    { value: 'ha', label: 'Hausa' },
    { value: 'ig', label: 'Igbo' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra_large', label: 'Extra Large' }
  ];

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
            Accessibility Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Language & Localization</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => setPreferences(prev => ({...prev, language: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Text & Display</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select 
                value={preferences.font_size} 
                onValueChange={(value: 'small' | 'medium' | 'large' | 'extra_large') => setPreferences(prev => ({...prev, font_size: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-sm text-gray-600">
                  Improves text readability with high contrast colors
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={preferences.high_contrast}
                onCheckedChange={(checked) => setPreferences(prev => ({...prev, high_contrast: checked}))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Audio & Voice</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="text-to-speech">Text-to-Speech</Label>
                <p className="text-sm text-gray-600">
                  Have text read aloud in your selected language
                </p>
              </div>
              <Switch
                id="text-to-speech"
                checked={preferences.text_to_speech}
                onCheckedChange={(checked) => setPreferences(prev => ({...prev, text_to_speech: checked}))}
              />
            </div>

            {preferences.text_to_speech && (
              <Button 
                variant="outline" 
                onClick={() => speakText("This is a test of the text-to-speech feature.")}
              >
                Test Text-to-Speech
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="biometric-login">Biometric Login</Label>
                <p className="text-sm text-gray-600">
                  Use fingerprint or face recognition to login
                </p>
              </div>
              <Switch
                id="biometric-login"
                checked={preferences.biometric_login_enabled}
                onCheckedChange={(checked) => setPreferences(prev => ({...prev, biometric_login_enabled: checked}))}
              />
            </div>
          </div>

          <Button onClick={savePreferences} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
