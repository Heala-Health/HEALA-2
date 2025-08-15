import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

interface APIConfigProps {
  onApiKeyChange?: (apiKey: string) => void;
  title?: string;
  description?: string;
}

export const APIConfig: React.FC<APIConfigProps> = ({
  onApiKeyChange,
  title = "AI API Configuration",
  description = "Configure your AI API key for enhanced functionality"
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('heala_ai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
      onApiKeyChange?.(savedKey);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('heala_ai_api_key', apiKey.trim());
      setSaved(true);
      onApiKeyChange?.(apiKey.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem('heala_ai_api_key');
    setApiKey('');
    setSaved(false);
    onApiKeyChange?.('');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            {description}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="Enter your AI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!apiKey.trim()} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {saved && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>

        {saved && (
          <Alert>
            <AlertDescription className="text-sm text-green-600">
              API key saved successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};