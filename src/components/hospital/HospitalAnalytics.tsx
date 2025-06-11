
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, Calendar, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalAppointments: number;
  activePhysicians: number;
  emergencyRequests: number;
  monthlyAppointments: any[];
  appointmentsByStatus: any[];
  physicianWorkload: any[];
}

export const HospitalAnalytics: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData>({
    totalAppointments: 0,
    activePhysicians: 0,
    emergencyRequests: 0,
    monthlyAppointments: [],
    appointmentsByStatus: [],
    physicianWorkload: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchAnalytics();
    }
  }, [user, profile]);

  const fetchAnalytics = async () => {
    if (!profile?.hospital_id) return;

    setLoading(true);
    try {
      // Generate analytics data first
      await supabase.rpc('generate_hospital_analytics', { 
        hospital_uuid: profile.hospital_id 
      });

      // Fetch basic metrics
      const [appointmentsResult, physiciansResult, emergencyResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, appointment_date, created_at')
          .eq('hospital_id', profile.hospital_id),
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician')
          .eq('is_active', true),
        supabase
          .from('emergency_requests')
          .select('id, severity, status, created_at')
          .eq('hospital_id', profile.hospital_id)
      ]);

      const appointments = appointmentsResult.data || [];
      const physicians = physiciansResult.data || [];
      const emergencies = emergencyResult.data || [];

      // Process monthly appointments data
      const monthlyData = processMonthlyAppointments(appointments);
      
      // Process appointment status data
      const statusData = processAppointmentsByStatus(appointments);
      
      // Process physician workload
      const workloadData = processPhysicianWorkload(appointments, physicians);

      setData({
        totalAppointments: appointments.length,
        activePhysicians: physicians.length,
        emergencyRequests: emergencies.length,
        monthlyAppointments: monthlyData,
        appointmentsByStatus: statusData,
        physicianWorkload: workloadData
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyAppointments = (appointments: any[]) => {
    const monthlyCount: { [key: string]: number } = {};
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyCount[monthKey] = 0;
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        appointments: 0
      });
    }

    appointments.forEach(apt => {
      const monthKey = apt.appointment_date.slice(0, 7);
      if (monthlyCount.hasOwnProperty(monthKey)) {
        monthlyCount[monthKey]++;
      }
    });

    return last6Months.map((month, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const monthKey = date.toISOString().slice(0, 7);
      return {
        ...month,
        appointments: monthlyCount[monthKey] || 0
      };
    });
  };

  const processAppointmentsByStatus = (appointments: any[]) => {
    const statusCount: { [key: string]: number } = {};
    
    appointments.forEach(apt => {
      const status = apt.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const processPhysicianWorkload = (appointments: any[], physicians: any[]) => {
    const workload: { [key: string]: number } = {};
    
    physicians.forEach(physician => {
      workload[physician.id] = 0;
    });

    appointments.forEach(apt => {
      if (workload.hasOwnProperty(apt.physician_id)) {
        workload[apt.physician_id]++;
      }
    });

    return physicians.map(physician => ({
      name: `${physician.first_name} ${physician.last_name}`,
      appointments: workload[physician.id] || 0
    })).sort((a, b) => b.appointments - a.appointments);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hospital Analytics</h2>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold">{data.totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Physicians</p>
                <p className="text-2xl font-bold">{data.activePhysicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Emergency Requests</p>
                <p className="text-2xl font-bold">{data.emergencyRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {data.monthlyAppointments[data.monthlyAppointments.length - 1]?.appointments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {data.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Physician Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Physician Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.physicianWorkload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="appointments" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
