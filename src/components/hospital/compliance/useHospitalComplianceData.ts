
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ComplianceTracking, ComplianceAlert } from './types';
import {
  fetchComplianceTracking,
  fetchComplianceAlerts,
  updateComplianceStatus as updateComplianceStatusService,
  resolveComplianceAlert as resolveComplianceAlertService,
  calculateOverallComplianceScore
} from './complianceService';
import { getComplianceSummary } from './complianceUtils';

export const useHospitalComplianceData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complianceData, setComplianceData] = useState<ComplianceTracking[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceData = useCallback(async () => {
    if (!profile?.hospital_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [complianceTracking, alertData] = await Promise.all([
        fetchComplianceTracking(profile.hospital_id),
        fetchComplianceAlerts(profile.hospital_id)
      ]);

      setComplianceData(complianceTracking);
      setAlerts(alertData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compliance data';
      console.error('Error fetching compliance data:', error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.hospital_id, toast]);

  const updateComplianceStatus = async (
    complianceId: string,
    status: ComplianceTracking['status'],
    score?: number,
    violations?: any[],
    correctiveActions?: any[]
  ) => {
    try {
      setActionLoading(`update-${complianceId}`);
      await updateComplianceStatusService(
        complianceId,
        status,
        profile?.id,
        score,
        violations,
        correctiveActions
      );

      toast({
        title: "Success",
        description: "Compliance status updated successfully.",
      });

      await fetchComplianceData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update compliance status';
      console.error('Error updating compliance status:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setActionLoading(`resolve-${alertId}`);
      await resolveComplianceAlertService(alertId, profile?.id);

      toast({
        title: "Success",
        description: "Compliance alert resolved successfully.",
      });

      await fetchComplianceData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve alert';
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const calculateOverallScore = async () => {
    if (!profile?.hospital_id) return 0;

    try {
      return await calculateOverallComplianceScore(profile.hospital_id);
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 0;
    }
  };

  const retryFetch = useCallback(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  return {
    complianceData,
    alerts,
    loading,
    actionLoading,
    error,
    updateComplianceStatus,
    resolveAlert,
    calculateOverallScore,
    refetch: fetchComplianceData,
    retry: retryFetch,
    summary: getComplianceSummary(complianceData, alerts)
  };
};
