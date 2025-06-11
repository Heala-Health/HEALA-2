
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Activity, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  activity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

export const ActivityDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    thisWeekAmbulance: 0,
    activePhysicians: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivityData();
      fetchStats();
    }
  }, [user]);

  const fetchActivityData = async () => {
    try {
      // Simulate activity data since we don't have access to the new table yet
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          activity_type: 'appointment_booked',
          entity_id: 'apt_1',
          details: { appointment_date: '2024-01-15', patient_name: 'John Doe' },
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          activity_type: 'ambulance_requested',
          entity_id: 'amb_1',
          details: { emergency_type: 'Medical Emergency', pickup_address: '123 Main St' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      toast({
        title: "Error",
        description: "Failed to load activity data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats data
      setStats({
        todayAppointments: 8,
        thisWeekAmbulance: 3,
        activePhysicians: 5,
        avgResponseTime: 4.2
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment_booked': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'ambulance_requested': return <MapPin className="w-4 h-4 text-red-600" />;
      case 'physician_added': return <User className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'appointment_booked': return 'bg-blue-100 text-blue-800';
      case 'ambulance_requested': return 'bg-red-100 text-red-800';
      case 'physician_added': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    switch (activity.activity_type) {
      case 'appointment_booked':
        return `New appointment scheduled for ${activity.details?.appointment_date}`;
      case 'ambulance_requested':
        return `Emergency ${activity.details?.emergency_type} request from ${activity.details?.pickup_address}`;
      case 'physician_added':
        return `New physician added to the hospital`;
      default:
        return 'Hospital activity logged';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading activity data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency Requests</p>
                <p className="text-2xl font-bold">{stats.thisWeekAmbulance}</p>
              </div>
              <MapPin className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Physicians</p>
                <p className="text-2xl font-bold">{stats.activePhysicians}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime} min</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Real-time hospital activity and booking updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                <p className="text-gray-600">Hospital activity will appear here as it happens.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getActivityBadgeColor(activity.activity_type)}>
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
