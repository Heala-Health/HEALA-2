
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceReport {
  id: string;
  report_type: string;
  report_data: any;
  date_range_start: string;
  date_range_end: string;
  status: string;
  created_at: string;
}

export const FixedComplianceReports: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('user_activity');

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
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

  useEffect(() => {
    fetchReports();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last 30 days

      let reportData = {};
      
      if (reportType === 'user_activity') {
        const { data: activityData } = await supabase
          .from('user_activity_logs')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        reportData = {
          total_activities: activityData?.length || 0,
          activity_breakdown: activityData?.reduce((acc: any, log) => {
            acc[log.activity_type] = (acc[log.activity_type] || 0) + 1;
            return acc;
          }, {}),
          date_range: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        };
      }

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert({
          report_type: reportType,
          report_data: reportData,
          date_range_start: startDate.toISOString().split('T')[0],
          date_range_end: endDate.toISOString().split('T')[0],
          generated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_type_param: 'compliance_report_generated',
        action_details_param: {
          report_type: reportType,
          report_id: data.id
        }
      });

      toast({
        title: "Success",
        description: "Compliance report generated successfully.",
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

  const formatReportData = (data: any) => {
    if (!data) return 'No data available';
    
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="mb-2">
        <span className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}:</span>
        <span className="ml-2">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
        </span>
      </div>
    ));
  };

  if (loading) {
    return <div className="p-6">Loading compliance reports...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user_activity">User Activity Report</SelectItem>
                <SelectItem value="financial_summary">Financial Summary</SelectItem>
                <SelectItem value="security_audit">Security Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateReport} disabled={generating}>
            <Plus className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {report.report_type.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Period: {report.date_range_start} to {report.date_range_end}
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <h4 className="font-medium mb-2">Report Summary:</h4>
                  {formatReportData(report.report_data)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
