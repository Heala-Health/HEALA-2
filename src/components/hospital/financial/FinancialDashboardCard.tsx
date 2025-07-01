
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { useHospitalFinancialData } from './useHospitalFinancialData';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const FinancialDashboardCardContent: React.FC = () => {
  const { summary, alerts, loading, actionLoading, error, resolveAlert, retry } = useHospitalFinancialData();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Error Loading Financial Data
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
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading financial data..." className="py-8" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Overview (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Net Income</span>
              </div>
              <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netIncome)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            {summary.transactionCount} transactions recorded this month
          </div>
        </CardContent>
      </Card>

      {/* Financial Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Financial Alerts ({alerts.length})
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
                    {alert.current_value && alert.threshold_value && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {formatCurrency(alert.current_value)} | 
                        Threshold: {formatCurrency(alert.threshold_value)}
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

export const FinancialDashboardCard: React.FC = () => {
  return (
    <ErrorBoundary>
      <FinancialDashboardCardContent />
    </ErrorBoundary>
  );
};
