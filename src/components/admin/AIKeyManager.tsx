import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { aiService } from '@/services/aiService';
import { Key, Save, TestTube } from 'lucide-react';

export const AIKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const savedKey = localStorage.getItem('heala_ai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    aiService.setApiKey(apiKey);
    setTestResult('API key saved successfully!');
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult('');
    
    aiService.setApiKey(apiKey);
    const response = await aiService.sendChatMessage('Hello, this is a test message.');
    
    if (response.success) {
      setTestResult('✅ API connection successful!');
    } else {
      setTestResult(`❌ API test failed: ${response.error}`);
    }
    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          AI API Key Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            <Save className="w-4 h-4 mr-2" />
            Save Key
          </Button>
          <Button onClick={testConnection} disabled={!apiKey.trim() || testing} variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>

        {testResult && (
          <Alert>
            <AlertDescription>{testResult}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};