
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useHospitalComplianceData } from './useHospitalComplianceData';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const ComplianceDashboardCardContent: React.FC = () => {
  const { 
    complianceData, 
    alerts, 
    loading,
    actionLoading,
    error,
    resolveAlert, 
    calculateOverallScore,
    retry,
    summary 
  } = useHospitalComplianceData();
  
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    const fetchScore = async () => {
      if (!loading) {
        const score = await calculateOverallScore();
        setOverallScore(score);
      }
    };
    
    fetchScore();
  }, [loading, calculateOverallScore]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            Error Loading Compliance Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading compliance data..." className="py-8" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'non_compliant':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="mb-2">
              <span className="text-sm text-gray-600">Overall Compliance Score</span>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <Progress value={overallScore} className="mt-3" />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Compliant</span>
              </div>
              <p className="text-xl font-bold text-green-600">{summary.compliantCount}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Non-Compliant</span>
              </div>
              <p className="text-xl font-bold text-red-600">{summary.nonCompliantCount}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <p className="text-xl font-bold text-yellow-600">{summary.pendingCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceData.map((compliance) => (
              <div key={compliance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(compliance.status)}
                  <div>
                    <h4 className="font-medium capitalize">
                      {compliance.compliance_type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Score: {compliance.score}% | 
                      Last assessed: {new Date(compliance.last_assessment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(compliance.status)}>
                  {compliance.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Compliance Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    {alert.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(alert.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                    disabled={actionLoading === `resolve-${alert.id}`}
                  >
                    {actionLoading === `resolve-${alert.id}` ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Resolve'
                    )}
                  </Button>
                </div>
              ))}
              
              {alerts.length > 3 && (
                <div className="text-center">
                  <Button variant="link" size="sm">
                    View {alerts.length - 3} more alerts
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const ComplianceDashboardCard: React.FC = () => {
  return (
    <ErrorBoundary>
      <ComplianceDashboardCardContent />
    </ErrorBoundary>
  );
};
