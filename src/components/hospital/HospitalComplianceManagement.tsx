
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, Clock, Download, Shield, Eye, Archive } from 'lucide-react';
import { useHospitalComplianceData } from './compliance/useHospitalComplianceData';
import { ComplianceDashboardCard } from './compliance/ComplianceDashboardCard';

export const HospitalComplianceManagement: React.FC = () => {
  const { complianceData, alerts, loading } = useHospitalComplianceData();

  const generateComplianceReport = async (reportType: string) => {
    // Mock report generation - in real implementation, this would generate actual reports
    console.log(`Generating ${reportType} compliance report...`);
  };

  const getAuditTypeIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'modification': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'creation': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deletion': return <Archive className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Mock audit trail data - in real implementation, this would come from enhanced_audit_logs
  const mockAuditTrails = [
    {
      id: '1',
      action: 'Patient record accessed',
      user: 'Dr. Sarah Johnson',
      timestamp: new Date().toISOString(),
      details: 'Viewed patient medical history - Patient ID: 12345',
      type: 'access'
    },
    {
      id: '2',
      action: 'Prescription created',
      user: 'Dr. Michael Chen',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      details: 'Created prescription for antibiotics - Patient ID: 12346',
      type: 'creation'
    },
    {
      id: '3',
      action: 'Medical record updated',
      user: 'Nurse Emma Wilson',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Updated vital signs and patient notes - Patient ID: 12347',
      type: 'modification'
    },
    {
      id: '4',
      action: 'User login',
      user: 'Admin John Doe',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'Hospital administrator logged into system',
      type: 'access'
    }
  ];

  if (loading) {
    return <div className="p-6">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compliance Dashboard Cards */}
      <ComplianceDashboardCard />

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Compliance Reports
            </div>
            <Button onClick={() => generateComplianceReport('All')}>
              <Download className="w-4 h-4 mr-2" />
              Export All Reports
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.map((compliance) => (
              <div key={compliance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {compliance.status === 'compliant' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : compliance.status === 'non_compliant' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <h4 className="font-medium capitalize">
                      {compliance.compliance_type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Compliance tracking and monitoring for {compliance.compliance_type.replace('_', ' ')}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Last Updated: {new Date(compliance.last_assessment_date).toLocaleDateString()}
                      </span>
                      {compliance.next_assessment_due && (
                        <span className="text-xs text-gray-500">
                          Next Due: {new Date(compliance.next_assessment_due).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Score: {compliance.score}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    compliance.status === 'compliant' 
                      ? 'bg-green-100 text-green-800'
                      : compliance.status === 'non_compliant'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }>
                    {compliance.status.replace('_', ' ')}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => generateComplianceReport(compliance.compliance_type)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAuditTrails.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getAuditTypeIcon(audit.type)}
                  <div>
                    <p className="font-medium">{audit.action}</p>
                    <p className="text-sm text-gray-600">{audit.details}</p>
                    <p className="text-xs text-gray-500">by {audit.user}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(audit.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
