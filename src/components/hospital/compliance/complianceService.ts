
import { supabase } from '@/integrations/supabase/client';
import type { ComplianceTracking, ComplianceAlert } from './types';

export const fetchComplianceTracking = async (hospitalId: string) => {
  const { data, error } = await supabase
    .from('hospital_compliance_tracking')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('last_assessment_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(c => ({
    ...c,
    status: c.status as ComplianceTracking['status'],
    violations: Array.isArray(c.violations) ? c.violations : [],
    corrective_actions: Array.isArray(c.corrective_actions) ? c.corrective_actions : [],
    assessment_details: c.assessment_details || {}
  }));
};

export const fetchComplianceAlerts = async (hospitalId: string) => {
  const { data, error } = await supabase
    .from('compliance_alerts')
    .select('*')
    .eq('hospital_id', hospitalId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(a => ({
    ...a,
    severity: a.severity as ComplianceAlert['severity'],
    metadata: a.metadata || {}
  }));
};

export const updateComplianceStatus = async (
  complianceId: string,
  status: ComplianceTracking['status'],
  assessedBy?: string,
  score?: number,
  violations?: any[],
  correctiveActions?: any[]
) => {
  const updateData: any = {
    status,
    last_assessment_date: new Date().toISOString().split('T')[0],
    assessed_by: assessedBy
  };

  if (score !== undefined) updateData.score = score;
  if (violations) updateData.violations = violations;
  if (correctiveActions) updateData.corrective_actions = correctiveActions;

  const { error } = await supabase
    .from('hospital_compliance_tracking')
    .update(updateData)
    .eq('id', complianceId);

  if (error) throw error;
};

export const resolveComplianceAlert = async (alertId: string, resolvedBy?: string) => {
  const { error } = await supabase
    .from('compliance_alerts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy
    })
    .eq('id', alertId);

  if (error) throw error;
};

export const calculateOverallComplianceScore = async (hospitalId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('calculate_hospital_compliance_score', {
      hospital_uuid: hospitalId
    });

  if (error) throw error;
  return data || 0;
};
