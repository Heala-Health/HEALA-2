
import { useState } from 'react';
import { SymptomRule, SymptomResult } from '../types';
import { useToast } from '@/hooks/use-toast';

export const useSymptomAnalysis = (symptomRules: SymptomRule[]) => {
  const { toast } = useToast();
  const [results, setResults] = useState<SymptomResult[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeSymptoms = (symptoms: string) => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms Entered",
        description: "Please describe your symptoms to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    if (symptomRules.length === 0) {
      toast({
        title: "Database Not Available",
        description: "Symptom database is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Enhanced keyword matching algorithm
    const symptomWords = symptoms.toLowerCase()
      .split(/[\s,;.!?-]+/)
      .filter(word => word.length > 2);
    
    const matches: SymptomResult[] = [];

    symptomRules.forEach(rule => {
      const matchedKeywords = rule.keywords.filter(keyword =>
        symptomWords.some(word => 
          word.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(word) ||
          (word.length > 3 && keyword.toLowerCase().includes(word.substring(0, -1)))
        )
      );

      if (matchedKeywords.length > 0) {
        const keywordScore = (matchedKeywords.length / rule.keywords.length) * 100;
        const coverageScore = (matchedKeywords.length / symptomWords.length) * 100;
        const confidence = Math.min((keywordScore + coverageScore) / 2, 100);
        
        matches.push({
          rule,
          matchedKeywords,
          confidence: Math.round(confidence)
        });
      }
    });

    // Sort by confidence and severity weight
    matches.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aWeight = severityWeight[a.rule.severity] * a.confidence;
      const bWeight = severityWeight[b.rule.severity] * b.confidence;
      return bWeight - aWeight;
    });

    setResults(matches.slice(0, 5));
    setLoading(false);

    if (matches.length === 0) {
      toast({
        title: "No Matches Found",
        description: "Your symptoms don't match our database. Please consult a healthcare professional for proper evaluation.",
      });
    }
  };

  return {
    results,
    loading,
    analyzeSymptoms
  };
};
