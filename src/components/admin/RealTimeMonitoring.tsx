
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, Calendar, AlertTriangle, TrendingUp, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  activeUsers: number;
  totalSessions: number;
  emergencyAlerts: number;
  systemLoad: number;
  appointmentsToday: number;
  consultationsActive: number;
}

export const RealTimeMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    emergencyAlerts: 0,
    systemLoad: 0,
    appointmentsToday: 0,
    consultationsActive: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch various metrics
      const [
        { count: totalUsers },
        { count: emergencyCount },
        { count: appointmentsCount },
        { count: activeConsultations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('emergency_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('consultation_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      // Simulate some metrics (in a real app, these would come from actual monitoring)
      const activeUsers = Math.floor(totalUsers * 0.15); // Assume 15% of users are active
      const systemLoad = Math.random() * 100; // Random system load percentage

      setMetrics({
        activeUsers,
        totalSessions: totalUsers,
        emergencyAlerts: emergencyCount || 0,
        systemLoad,
        appointmentsToday: appointmentsCount || 0,
        consultationsActive: activeConsultations || 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthColor = (load: number) => {
    if (load < 30) return 'text-green-600';
    if (load < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSystemHealthText = (load: number) => {
    if (load < 30) return 'Healthy';
    if (load < 70) return 'Moderate';
    return 'High Load';
  };

  if (loading) {
    return <div className="p-6">Loading real-time monitoring...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Emergency Alerts</p>
                <p className="text-2xl font-bold">{metrics.emergencyAlerts}</p>
                {metrics.emergencyAlerts > 0 && (
                  <Badge variant="destructive" className="text-xs">Action Required</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Consultations</p>
                <p className="text-2xl font-bold">{metrics.consultationsActive}</p>
                <Badge variant="default" className="text-xs">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Health Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">System Load</span>
                <span className={`text-sm font-semibold ${getSystemHealthColor(metrics.systemLoad)}`}>
                  {getSystemHealthText(metrics.systemLoad)}
                </span>
              </div>
              <Progress value={metrics.systemLoad} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{metrics.systemLoad.toFixed(1)}% utilization</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">User Activity</span>
                <span className="text-sm font-semibold text-blue-600">
                  {((metrics.activeUsers / metrics.totalSessions) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(metrics.activeUsers / metrics.totalSessions) * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{metrics.activeUsers} of {metrics.totalSessions} users active</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Today's Appointments</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{metrics.appointmentsToday}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Platform Uptime</span>
              </div>
              <p className="text-xl font-bold text-green-600">99.9%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
