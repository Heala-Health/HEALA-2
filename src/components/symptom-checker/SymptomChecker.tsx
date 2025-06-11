import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, Info, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PossibleCondition {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
  recommendedAction: string;
  specialistRequired?: string;
}

interface SymptomDiagnosisResponse {
  possibleConditions: PossibleCondition[];
  disclaimer: string;
}

export const SymptomChecker: React.FC = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState<PossibleCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');

  const analyzeSymptoms = async () => { // Made async
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms Entered",
        description: "Please describe your symptoms to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResults([]); // Clear previous results
    setDisclaimer(''); // Clear previous disclaimer

    try {
      const { data, error } = await supabase.functions.invoke('symptom-diagnosis', {
        body: JSON.stringify({ symptoms: symptoms }),
      });

      if (error) {
        throw new Error(`Diagnosis failed: ${error.message}`);
      }

      const diagnosisResponse: SymptomDiagnosisResponse = data;

      if (diagnosisResponse?.possibleConditions && Array.isArray(diagnosisResponse.possibleConditions)) {
        setResults(diagnosisResponse.possibleConditions);
        setDisclaimer(diagnosisResponse.disclaimer || '');
      } else {
        throw new Error("Invalid response format from diagnosis service.");
      }

      if (diagnosisResponse.possibleConditions.length === 0) {
        toast({
          title: "No Specific Conditions Identified",
          description: "Based on your symptoms, no specific conditions could be confidently identified. Please consult a healthcare professional for a proper diagnosis.",
        });
      }

    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Diagnosis Failed",
        description: error.message || "Failed to get a diagnosis. Please try again.",
        variant: "destructive"
      });
      setResults([]);
      setDisclaimer('');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Symptom Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {disclaimer && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                {disclaimer}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe your symptoms</Label>
            <Input
              id="symptoms"
              placeholder="e.g., fever, headache, body aches..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={analyzeSymptoms} 
            disabled={loading || !symptoms.trim()}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Check Symptoms'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Possible Conditions</h3>
          {results.map((result, index) => (
            <Card key={index} className={`border-l-4 ${getSeverityColor(result.severity)}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{result.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(result.severity)}>
                        {getSeverityIcon(result.severity)}
                        {result.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h5 className="font-medium text-sm">General advice:</h5>
                      <p className="text-sm text-gray-600">{result.advice}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm">Recommended action:</h5>
                      <p className="text-sm text-gray-600">{result.recommendedAction}</p>
                    </div>

                    {result.specialistRequired && (
                      <div>
                        <h5 className="font-medium text-sm">Specialist required:</h5>
                        <p className="text-sm text-gray-600">{result.specialistRequired}</p>
                      </div>
                    )}
                  </div>

                  {result.severity === 'critical' && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>This appears to be a medical emergency.</strong> Please seek immediate medical attention 
                        or call emergency services.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900">Need immediate help?</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    If this is an emergency, don't wait - call for help immediately.
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Emergency:</strong> 199 or 112</p>
                    <p><strong>Lagos Emergency:</strong> 199</p>
                    <p><strong>Abuja Emergency:</strong> 112</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
