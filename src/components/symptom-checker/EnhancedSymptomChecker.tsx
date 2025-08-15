import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { APIConfig } from '@/components/shared/APIConfig';
import { aiService } from '@/services/aiService';
import { Stethoscope, Search, Settings, AlertTriangle, Info } from 'lucide-react';

interface AnalysisResult {
  possibleConditions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export const EnhancedSymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [rawResponse, setRawResponse] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('heala_ai_api_key');
    setApiConfigured(!!savedKey);
    if (savedKey) {
      aiService.setApiKey(savedKey);
    }
  }, []);

  const handleApiKeyChange = (apiKey: string) => {
    setApiConfigured(!!apiKey);
    aiService.setApiKey(apiKey);
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    setResult(null);
    setRawResponse('');

    // Get user health history from localStorage if available
    const userHealthHistory = localStorage.getItem('user_health_history') || '';

    const response = await aiService.analyzeSymptoms(symptoms, userHealthHistory);

    if (response.success && response.analysis) {
      setResult(response.analysis);
    } else if (response.success) {
      setRawResponse(response.message);
    } else {
      setRawResponse(`Error: ${response.error}`);
    }

    setLoading(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'critical' || urgency === 'high') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Info className="w-4 h-4" />;
  };

  if (!apiConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Alert>
          <AlertDescription>
            AI Symptom Checker is not configured. Please contact your administrator to set up the API key.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            AI-Powered Symptom Checker
          </CardTitle>

        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This AI-powered symptom checker analyzes your symptoms using advanced AI and your health history. 
              It provides personalized insights but should not replace professional medical advice.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe your symptoms in detail</Label>
            <Textarea
              id="symptoms"
              placeholder="e.g., I have been experiencing fever, headache, and body aches for the past 2 days. I also feel nauseous and have lost my appetite..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[120px] resize-none"
              rows={5}
            />
            <p className="text-sm text-gray-500">
              Be as specific as possible. Include duration, intensity, and any other relevant details.
            </p>
          </div>

          <Button 
            onClick={analyzeSymptoms} 
            disabled={loading || !symptoms.trim()}
            className="w-full"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Analyzing Symptoms...' : 'Analyze Symptoms with AI'}
          </Button>
        </CardContent>
      </Card>

      {(result || rawResponse) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Analysis Results
              {result && (
                <Badge className={`${getUrgencyColor(result.urgency)} text-white`}>
                  {getUrgencyIcon(result.urgency)}
                  {result.urgency.toUpperCase()} PRIORITY
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Possible Conditions:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.possibleConditions.map((condition, index) => (
                      <li key={index} className="text-sm">{condition}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm">{recommendation}</li>
                    ))}
                  </ul>
                </div>

                {(result.urgency === 'critical' || result.urgency === 'high') && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>URGENT:</strong> Based on your symptoms, you should seek immediate medical attention. 
                      Please contact emergency services or visit the nearest hospital.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{rawResponse}</p>
              </div>
            )}

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                This analysis is based on AI interpretation of your symptoms and health history. 
                Always consult with a healthcare professional for proper diagnosis and treatment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};