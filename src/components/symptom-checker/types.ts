
export interface SymptomRule {
  id: string;
  symptom_name: string;
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
  recommended_action: string;
  specialist_required?: string;
  is_active: boolean;
}

export interface SymptomResult {
  rule: SymptomRule;
  matchedKeywords: string[];
  confidence: number;
}
