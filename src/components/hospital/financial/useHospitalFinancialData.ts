
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FinancialTransaction {
  id: string;
  hospital_id: string;
  transaction_type: 'revenue' | 'expense' | 'payment';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  reference_id?: string;
  transaction_date: string;
  fiscal_month: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FinancialAlert {
  id: string;
  hospital_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold_value?: number;
  current_value?: number;
  metadata: any;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export const useHospitalFinancialData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = useCallback(async () => {
    if (!profile?.hospital_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch financial transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('hospital_financial_data')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (transactionError) throw transactionError;

      // Fetch financial alerts
      const { data: alertData, error: alertError } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (alertError) throw alertError;

      // Type-cast the data to match our interfaces
      setTransactions((transactionData || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as FinancialTransaction['transaction_type'],
        metadata: t.metadata || {}
      })));
      
      setAlerts((alertData || []).map(a => ({
        ...a,
        severity: a.severity as FinancialAlert['severity'],
        metadata: a.metadata || {}
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch financial data';
      console.error('Error fetching financial data:', error);
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

  const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at' | 'fiscal_month'>) => {
    try {
      setActionLoading('add-transaction');
      const { error } = await supabase
        .from('hospital_financial_data')
        .insert({
          ...transaction,
          hospital_id: profile?.hospital_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Financial transaction recorded successfully.",
      });

      await fetchFinancialData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record transaction';
      console.error('Error adding transaction:', error);
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
      const { error } = await supabase
        .from('financial_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert resolved successfully.",
      });

      await fetchFinancialData();
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

  const getFinancialSummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTransactions = transactions.filter(t => t.fiscal_month === currentMonth);
    
    const totalRevenue = currentMonthTransactions
      .filter(t => t.transaction_type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      transactionCount: currentMonthTransactions.length,
      alertCount: alerts.length
    };
  };

  const retryFetch = useCallback(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    transactions,
    alerts,
    loading,
    actionLoading,
    error,
    addTransaction,
    resolveAlert,
    refetch: fetchFinancialData,
    retry: retryFetch,
    summary: getFinancialSummary()
  };
};
