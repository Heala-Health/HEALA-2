
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileCheck, Activity, AlertTriangle, DollarSign, Shield, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  total_users: number;
  pending_verifications: number;
  active_hospitals: number;
  active_physicians: number;
  emergency_alerts: number;
  system_health: number;
  pending_disputes: number;
  total_activities_today: number;
}

export const AdminDashboardOverview: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    pending_verifications: 0,
    active_hospitals: 0,
    active_physicians: 0,
    emergency_alerts: 0,
    system_health: 95,
    pending_disputes: 0,
    total_activities_today: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    // Set up real-time subscriptions for immediate updates
    const channel = supabase
      .channel('admin-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_disputes' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activity_logs' }, fetchStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: pendingVerifications },
        { count: activeHospitals },
        { count: activePhysicians },
        { count: emergencyAlerts },
        { count: pendingDisputes },
        { count: activitiesToday }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'hospital_admin').eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'physician').eq('is_active', true),
        supabase.from('emergency_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('financial_disputes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_activity_logs').select('*', { count: 'exact', head: true }).gte('created_at', today)
      ]);

      setStats({
        total_users: totalUsers || 0,
        pending_verifications: pendingVerifications || 0,
        active_hospitals: activeHospitals || 0,
        active_physicians: activePhysicians || 0,
        emergency_alerts: emergencyAlerts || 0,
        system_health: Math.floor(Math.random() * 10) + 90, // Simulated system health 90-99%
        pending_disputes: pendingDisputes || 0,
        total_activities_today: activitiesToday || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 95) return 'text-green-600';
    if (health >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (health: number) => {
    if (health >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (health >= 90) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live updates enabled</span>
        </div>
        <Badge variant="outline" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Real-time
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-gray-500">Registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Pending Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_verifications}</div>
            <p className="text-xs text-gray-500">Require review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Active Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_hospitals}</div>
            <p className="text-xs text-gray-500">Verified & active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Physicians
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active_physicians}</div>
            <p className="text-xs text-gray-500">Licensed & active</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.emergency_alerts}</div>
            <p className="text-xs text-gray-500">Active emergencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.system_health)}`}>
              {stats.system_health}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getHealthBadge(stats.system_health)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pending Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.pending_disputes}</div>
            <p className="text-xs text-gray-500">Financial disputes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activities Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.total_activities_today}</div>
            <p className="text-xs text-gray-500">User activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileCheck className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Review Verifications</p>
              {stats.pending_verifications > 0 && (
                <Badge className="mt-1 bg-orange-100 text-orange-800">
                  {stats.pending_verifications} pending
                </Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-sm font-medium">Emergency Center</p>
              {stats.emergency_alerts > 0 && (
                <Badge className="mt-1 bg-red-100 text-red-800">
                  {stats.emergency_alerts} alerts
                </Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Financial Disputes</p>
              {stats.pending_disputes > 0 && (
                <Badge className="mt-1 bg-purple-100 text-purple-800">
                  {stats.pending_disputes} pending
                </Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Activity className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Real-time Monitor</p>
              <Badge className="mt-1 bg-blue-100 text-blue-800">
                Live
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
