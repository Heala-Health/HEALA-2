
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SymptomRule } from '../types';

export const useSymptomRules = () => {
  const { toast } = useToast();
  const [symptomRules, setSymptomRules] = useState<SymptomRule[]>([]);
  const [fetchingRules, setFetchingRules] = useState(true);

  useEffect(() => {
    fetchSymptomRules();
  }, []);

  const fetchSymptomRules = async () => {
    try {
      setFetchingRules(true);
      const { data, error } = await supabase
        .from('symptom_rules')
        .select('*')
        .eq('is_active', true)
        .order('symptom_name');

      if (error) {
        console.error('Error fetching symptom rules:', error);
        toast({
          title: "Error Loading Data",
          description: "Unable to load symptom database. Please try again later.",
          variant: "destructive"
        });
        return;
      }
      
      // Type assertion with proper severity mapping
      const typedData = (data || []).map(rule => ({
        ...rule,
        severity: rule.severity as 'low' | 'medium' | 'high' | 'critical'
      })) as SymptomRule[];
      
      setSymptomRules(typedData);
    } catch (error) {
      console.error('Error fetching symptom rules:', error);
      toast({
        title: "Error Loading Data",
        description: "Unable to load symptom database. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setFetchingRules(false);
    }
  };

  return {
    symptomRules,
    fetchingRules
  };
};
