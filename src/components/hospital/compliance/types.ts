
export interface ComplianceTracking {
  id: string;
  hospital_id: string;
  compliance_type: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'under_review';
  score: number;
  last_assessment_date: string;
  next_assessment_due?: string;
  assessment_details: any;
  violations: any[];
  corrective_actions: any[];
  assessed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAlert {
  id: string;
  hospital_id: string;
  compliance_type: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  compliance_score?: number;
  due_date?: string;
  metadata: any;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface ComplianceSummary {
  compliantCount: number;
  nonCompliantCount: number;
  pendingCount: number;
  averageScore: number;
  totalItems: number;
  alertCount: number;
}
