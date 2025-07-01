
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAnalyticsData } from './analytics/useAnalyticsData';
import { AnalyticsMetrics } from './analytics/AnalyticsMetrics';
import { AnalyticsCharts } from './analytics/AnalyticsCharts';

export const HospitalAnalytics: React.FC = () => {
  const { data, loading, refetch } = useAnalyticsData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = {
    totalAppointments: data.totalAppointments,
    activePhysicians: data.activePhysicians,
    emergencyRequests: data.emergencyRequests,
    thisMonthAppointments: data.monthlyAppointments[data.monthlyAppointments.length - 1]?.appointments || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hospital Analytics</h2>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <AnalyticsMetrics metrics={metrics} />

      <AnalyticsCharts 
        monthlyAppointments={data.monthlyAppointments}
        appointmentsByStatus={data.appointmentsByStatus}
        physicianWorkload={data.physicianWorkload}
      />
    </div>
  );
};
