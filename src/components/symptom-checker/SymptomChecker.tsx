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

interface SymptomRule {
  id: string;
  symptom_name: string;
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
  recommended_action: string;
  specialist_required?: string;
  is_active: boolean;
}

interface SymptomResult {
  rule: SymptomRule;
  matchedKeywords: string[];
  confidence: number;
}

export const SymptomChecker: React.FC = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState<SymptomResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [symptomRules, setSymptomRules] = useState<SymptomRule[]>([]);

  useEffect(() => {
    fetchSymptomRules();
  }, []);

  const fetchSymptomRules = async () => {
    try {
      const { data, error } = await supabase
        .from('symptom_rules' as any)
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Validate data structure
      const validRules = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 'id' in item
      ).map((item: any) => ({
        id: item.id,
        symptom_name: item.symptom_name,
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        severity: item.severity || 'medium',
        advice: item.advice || '',
        recommended_action: item.recommended_action || '',
        specialist_required: item.specialist_required,
        is_active: Boolean(item.is_active)
      }));
      
      setSymptomRules(validRules as SymptomRule[]);
    } catch (error) {
      console.error('Error fetching symptom rules:', error);
    }
  };

  const analyzeSymptoms = () => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms Entered",
        description: "Please describe your symptoms to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simple keyword matching algorithm
    const symptomWords = symptoms.toLowerCase().split(/\s+/);
    const matches: SymptomResult[] = [];

    symptomRules.forEach(rule => {
      const matchedKeywords = rule.keywords.filter(keyword =>
        symptomWords.some(word => word.includes(keyword) || keyword.includes(word))
      );

      if (matchedKeywords.length > 0) {
        const confidence = (matchedKeywords.length / rule.keywords.length) * 100;
        matches.push({
          rule,
          matchedKeywords,
          confidence
        });
      }
    });

    // Sort by confidence and severity
    matches.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aWeight = severityWeight[a.rule.severity] * a.confidence;
      const bWeight = severityWeight[b.rule.severity] * b.confidence;
      return bWeight - aWeight;
    });

    setResults(matches.slice(0, 3)); // Show top 3 matches
    setLoading(false);

    if (matches.length === 0) {
      toast({
        title: "No Matches Found",
        description: "Your symptoms don't match our database. Please consult a healthcare professional.",
      });
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
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This symptom checker is for informational purposes only and should not replace professional medical advice. 
              Always consult with a healthcare provider for proper diagnosis and treatment.
            </AlertDescription>
          </Alert>

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
            <Card key={result.rule.id} className={`border-l-4 ${getSeverityColor(result.rule.severity)}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{result.rule.symptom_name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(result.rule.severity)}>
                        {getSeverityIcon(result.rule.severity)}
                        {result.rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(result.confidence)}% match
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h5 className="font-medium text-sm">Matched symptoms:</h5>
                      <p className="text-sm text-gray-600">
                        {result.matchedKeywords.join(', ')}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm">General advice:</h5>
                      <p className="text-sm text-gray-600">{result.rule.advice}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm">Recommended action:</h5>
                      <p className="text-sm text-gray-600">{result.rule.recommended_action}</p>
                    </div>

                    {result.rule.specialist_required && (
                      <div>
                        <h5 className="font-medium text-sm">Specialist required:</h5>
                        <p className="text-sm text-gray-600">{result.rule.specialist_required}</p>
                      </div>
                    )}
                  </div>

                  {result.rule.severity === 'critical' && (
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
