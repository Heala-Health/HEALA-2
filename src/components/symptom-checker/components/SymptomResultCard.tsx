
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { SymptomResult } from '../types';

interface SymptomResultCardProps {
  result: SymptomResult;
  index: number;
}

export const SymptomResultCard: React.FC<SymptomResultCardProps> = ({ result, index }) => {
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
    <Card className={`border-l-4 transition-all hover:shadow-md ${getSeverityColor(result.rule.severity)}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">{result.rule.symptom_name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Based on {result.matchedKeywords.length} matching symptom{result.matchedKeywords.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={getSeverityColor(result.rule.severity)}>
                {getSeverityIcon(result.rule.severity)}
                {result.rule.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {result.confidence}% match
              </Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <div>
              <h5 className="font-medium text-sm text-gray-700 mb-1">Matched symptoms:</h5>
              <div className="flex flex-wrap gap-1">
                {result.matchedKeywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-medium text-sm text-gray-700 mb-1">General advice:</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{result.rule.advice}</p>
            </div>

            <div>
              <h5 className="font-medium text-sm text-gray-700 mb-1">Recommended action:</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{result.rule.recommended_action}</p>
            </div>

            {result.rule.specialist_required && (
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-1">Specialist consultation:</h5>
                <p className="text-sm text-gray-600">{result.rule.specialist_required}</p>
              </div>
            )}
          </div>

          {result.rule.severity === 'critical' && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>This appears to be a medical emergency.</strong> Please seek immediate medical attention 
                or call emergency services right away.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
