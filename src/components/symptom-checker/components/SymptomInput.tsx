
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface SymptomInputProps {
  symptoms: string;
  setSymptoms: (symptoms: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  disabled: boolean;
}

export const SymptomInput: React.FC<SymptomInputProps> = ({
  symptoms,
  setSymptoms,
  onAnalyze,
  loading,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="symptoms">Describe your symptoms in detail</Label>
      <Textarea
        id="symptoms"
        placeholder="e.g., I have been experiencing fever, headache, and body aches for the past 2 days..."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        className="min-h-[120px] resize-none"
        rows={5}
      />
      <p className="text-sm text-gray-500">
        Be as specific as possible. Include duration, intensity, and any other relevant details.
      </p>
      
      <Button 
        onClick={onAnalyze} 
        disabled={loading || !symptoms.trim() || disabled}
        className="w-full"
        size="lg"
      >
        <Search className="w-4 h-4 mr-2" />
        {loading ? 'Analyzing Symptoms...' : 'Check Symptoms'}
      </Button>
    </div>
  );
};
