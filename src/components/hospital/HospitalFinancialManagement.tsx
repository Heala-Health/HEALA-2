import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { useHospitalFinancialData } from './financial/useHospitalFinancialData';
import { FinancialDashboardCard } from './financial/FinancialDashboardCard';

export const HospitalFinancialManagement: React.FC = () => {
  const { transactions, alerts, loading, summary } = useHospitalFinancialData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointments': return <FileText className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'equipment': return <DollarSign className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'payment': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="p-6">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Dashboard Cards */}
      <FinancialDashboardCard />

      {/* Detailed Financial Management */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No financial transactions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(transaction.category)}
                        <div>
                          <h4 className="font-medium">{transaction.description || transaction.category}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {transaction.transaction_type} • {transaction.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === 'expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.currency}</p>
                      </div>
                    </div>
                  ))}
                  
                  {transactions.length > 10 && (
                    <div className="text-center">
                      <Button variant="outline">
                        View All {transactions.length} Transactions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  Monthly Report
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Revenue Analysis
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Expense Breakdown
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <AlertTriangle className="w-6 h-6 mb-2" />
                  Budget vs Actual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-medium text-gray-600">Monthly Revenue</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-medium text-gray-600">Monthly Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-medium text-gray-600">Net Income</h3>
                  <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netIncome)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-medium text-gray-600">Active Alerts</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary.alertCount}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center text-gray-500">
                <p>Detailed analytics charts and trends coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
