
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Calendar, FileCheck, TrendingUp, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Analytics {
  totalUsers: number;
  todayAppointments: number;
  pendingVerifications: number;
  totalAppointments: number;
  totalDocuments: number;
}

export const SystemAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    todayAppointments: 0,
    pendingVerifications: 0,
    totalAppointments: 0,
    totalDocuments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get today's appointments count
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Get pending verifications count
      const { count: pendingCount } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Get total physician documents count
      const { count: documentsCount } = await supabase
        .from('physician_documents')
        .select('*', { count: 'exact', head: true });

      setAnalytics({
        totalUsers: usersCount || 0,
        todayAppointments: todayCount || 0,
        pendingVerifications: pendingCount || 0,
        totalAppointments: appointmentsCount || 0,
        totalDocuments: documentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{analytics.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{analytics.todayAppointments}</div>
            <div className="text-sm text-gray-600">Appointments Today</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{analytics.pendingVerifications}</div>
            <div className="text-sm text-gray-600">Pending Verifications</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{analytics.totalAppointments}</div>
            <div className="text-sm text-gray-600">Total Appointments</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{analytics.totalDocuments}</div>
            <div className="text-sm text-gray-600">Physician Documents</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
