
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Stethoscope } from 'lucide-react';
import { useSymptomRules } from './hooks/useSymptomRules';
import { useSymptomAnalysis } from './hooks/useSymptomAnalysis';
import { SymptomInput } from './components/SymptomInput';
import { SymptomResultCard } from './components/SymptomResultCard';
import { EmergencyInfo } from './components/EmergencyInfo';

export const SymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const { symptomRules, fetchingRules } = useSymptomRules();
  const { results, loading, analyzeSymptoms } = useSymptomAnalysis(symptomRules);

  const handleAnalyze = () => {
    analyzeSymptoms(symptoms);
  };

  if (fetchingRules) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-gray-600">Loading symptom database...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Nigerian Health Symptom Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This symptom checker focuses on common illnesses in Nigeria and is for informational purposes only. 
              It should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
            </AlertDescription>
          </Alert>

          <SymptomInput
            symptoms={symptoms}
            setSymptoms={setSymptoms}
            onAnalyze={handleAnalyze}
            loading={loading}
            disabled={fetchingRules}
          />
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Possible Conditions</h3>
            <Badge variant="outline" className="text-xs">
              {results.length} match{results.length !== 1 ? 'es' : ''} found
            </Badge>
          </div>
          
          {results.map((result, index) => (
            <SymptomResultCard key={result.rule.id} result={result} index={index} />
          ))}

          <EmergencyInfo />
        </div>
      )}
    </div>
  );
};
