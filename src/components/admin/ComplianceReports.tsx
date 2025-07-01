
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Filter, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReport {
  id: string;
  report_type: string;
  report_data: any;
  generated_by: string;
  date_range_start: string | null;
  date_range_end: string | null;
  status: string;
  file_url: string | null;
  created_at: string;
  generator: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const ComplianceReports: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // First get the reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Then get generator profiles for each report
      const reportsWithGenerators = await Promise.all(
        (reportsData || []).map(async (report) => {
          const { data: generatorProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', report.generated_by)
            .single();

          return {
            ...report,
            generator: generatorProfile
          };
        })
      );

      setReports(reportsWithGenerators);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance reports.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    setGenerating(true);
    try {
      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      let reportData = {};

      // Generate different types of reports
      switch (reportType) {
        case 'user_activity':
          const { data: activities } = await supabase
            .from('user_activity_logs')
            .select('activity_type, created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          
          reportData = {
            total_activities: activities?.length || 0,
            activity_breakdown: activities?.reduce((acc: any, activity) => {
              acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
              return acc;
            }, {}) || {},
            date_range: { start: startDate, end: endDate }
          };
          break;

        case 'financial_summary':
          const { data: transactions } = await supabase
            .from('wallet_transactions')
            .select('amount, transaction_type, created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          
          const totalCredits = transactions?.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const totalDebits = transactions?.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          
          reportData = {
            total_transactions: transactions?.length || 0,
            total_credits: totalCredits,
            total_debits: totalDebits,
            net_flow: totalCredits - totalDebits,
            date_range: { start: startDate, end: endDate }
          };
          break;

        case 'security_audit':
          const { data: adminActions } = await supabase
            .from('admin_actions')
            .select('action_type, created_at, admin_id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
          
          reportData = {
            total_admin_actions: adminActions?.length || 0,
            action_breakdown: adminActions?.reduce((acc: any, action) => {
              acc[action.action_type] = (acc[action.action_type] || 0) + 1;
              return acc;
            }, {}) || {},
            unique_admins: new Set(adminActions?.map(a => a.admin_id) || []).size,
            date_range: { start: startDate, end: endDate }
          };
          break;

        default:
          reportData = { message: 'Generic compliance report', date_range: { start: startDate, end: endDate } };
      }

      const { error } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: reportType,
          report_data: reportData,
          generated_by: (await supabase.auth.getUser()).data.user?.id,
          date_range_start: startDate.toISOString().split('T')[0],
          date_range_end: endDate.toISOString().split('T')[0],
          status: 'generated'
        });

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: 'compliance_report_generated',
        target_resource_type_param: 'compliance_report',
        action_details_param: { report_type: reportType }
      });

      toast({
        title: "Report Generated",
        description: `${reportType.replace('_', ' ')} report has been generated successfully.`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: ComplianceReport) => {
    const dataStr = JSON.stringify(report.report_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.report_type}_${report.created_at.split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(report => 
    reportTypeFilter === 'all' || report.report_type === reportTypeFilter
  );

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'user_activity': return 'bg-blue-100 text-blue-800';
      case 'financial_summary': return 'bg-green-100 text-green-800';
      case 'security_audit': return 'bg-red-100 text-red-800';
      case 'data_privacy': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading compliance reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => generateReport('user_activity')}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              User Activity Report
            </Button>
            <Button
              onClick={() => generateReport('financial_summary')}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              Financial Summary
            </Button>
            <Button
              onClick={() => generateReport('security_audit')}
              disabled={generating}
              className="bg-red-600 hover:bg-red-700"
            >
              Security Audit
            </Button>
            <Button
              onClick={() => generateReport('data_privacy')}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Data Privacy Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Compliance Reports ({filteredReports.length})
            </CardTitle>
            <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user_activity">User Activity</SelectItem>
                <SelectItem value="financial_summary">Financial Summary</SelectItem>
                <SelectItem value="security_audit">Security Audit</SelectItem>
                <SelectItem value="data_privacy">Data Privacy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No compliance reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getReportTypeColor(report.report_type)}>
                        {report.report_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{report.status}</Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadReport(report)}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Generated by:</strong> {report.generator?.first_name || ''} {report.generator?.last_name || ''} ({report.generator?.email || 'Unknown'})
                    </p>
                    {report.date_range_start && report.date_range_end && (
                      <p className="text-sm">
                        <strong>Date Range:</strong> {report.date_range_start} to {report.date_range_end}
                      </p>
                    )}
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      <strong>Report Summary:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(report.report_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
