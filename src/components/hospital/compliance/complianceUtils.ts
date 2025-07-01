
import type { ComplianceTracking, ComplianceAlert, ComplianceSummary } from './types';

export const getComplianceSummary = (
  complianceData: ComplianceTracking[],
  alerts: ComplianceAlert[]
): ComplianceSummary => {
  const compliantCount = complianceData.filter(c => c.status === 'compliant').length;
  const nonCompliantCount = complianceData.filter(c => c.status === 'non_compliant').length;
  const pendingCount = complianceData.filter(c => c.status === 'pending').length;
  const averageScore = complianceData.length > 0 
    ? complianceData.reduce((sum, c) => sum + c.score, 0) / complianceData.length 
    : 0;

  return {
    compliantCount,
    nonCompliantCount,
    pendingCount,
    averageScore: Math.round(averageScore),
    totalItems: complianceData.length,
    alertCount: alerts.length
  };
};
