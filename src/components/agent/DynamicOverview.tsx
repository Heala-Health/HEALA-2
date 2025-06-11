
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Car, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AgentStats {
  assistedPatients: number;
  appointmentsBooked: number;
  transportRequests: number;
  successRate: number;
}

export const DynamicOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats>({
    assistedPatients: 0,
    appointmentsBooked: 0,
    transportRequests: 0,
    successRate: 0
  });

  useEffect(() => {
    if (user) {
      fetchAgentStats();
    }
  }, [user]);

  const fetchAgentStats = async () => {
    if (!user) return;

    try {
      const [patientsResult, appointmentsResult, transportResult, metricsResult] = await Promise.all([
        supabase.from('agent_assisted_patients').select('*', { count: 'exact', head: true }).eq('agent_id', user.id),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('agent_id', user.id),
        supabase.from('performance_metrics').select('*').eq('user_id', user.id)
      ]);

      const completedMetrics = metricsResult.data?.filter(m => 
        m.metric_type === 'appointment_completed' || m.metric_type === 'transport_completed'
      ).length || 0;

      const totalRequests = (appointmentsResult.count || 0) + (transportResult.count || 0);
      const successRate = totalRequests > 0 ? Math.round((completedMetrics / totalRequests) * 100) : 0;

      setStats({
        assistedPatients: patientsResult.count || 0,
        appointmentsBooked: appointmentsResult.count || 0,
        transportRequests: transportResult.count || 0,
        successRate
      });
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  };

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.assistedPatients}</div>
            <div className="text-sm text-gray-600">Active Patients</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.appointmentsBooked}</div>
            <div className="text-sm text-gray-600">Appointments Booked</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Car className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats.transportRequests}</div>
            <div className="text-sm text-gray-600">Transport Requests</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
