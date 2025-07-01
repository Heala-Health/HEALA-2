
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Activity, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: string;
  } | null;
}

export const UserActivityMonitor: React.FC = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUserActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-activity-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        () => {
          fetchUserActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserActivities = async () => {
    try {
      // First get the activity logs
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activitiesError) throw activitiesError;

      // Then get user profiles for each activity
      const activitiesWithUsers = await Promise.all(
        (activitiesData || []).map(async (activity) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, role')
            .eq('id', activity.user_id)
            .single();

          return {
            ...activity,
            ip_address: activity.ip_address as string | null,
            user: userProfile
          };
        })
      );

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast({
        title: "Error",
        description: "Failed to load user activities.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${activity.user?.first_name || ''} ${activity.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivityType = activityTypeFilter === 'all' || activity.activity_type === activityTypeFilter;
    const matchesRole = roleFilter === 'all' || activity.user?.role === roleFilter;
    
    return matchesSearch && matchesActivityType && matchesRole;
  });

  const getActivityTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'appointment_booking': return 'bg-blue-100 text-blue-800';
      case 'consultation_start': return 'bg-purple-100 text-purple-800';
      case 'emergency_request': return 'bg-red-100 text-red-800';
      case 'prescription_created': return 'bg-yellow-100 text-yellow-800';
      case 'wallet_transaction': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'physician': return 'bg-blue-100 text-blue-800';
      case 'hospital_admin': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading user activities...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          User Activity Monitor ({filteredActivities.length})
        </CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search activities or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="appointment_booking">Appointments</SelectItem>
              <SelectItem value="consultation_start">Consultations</SelectItem>
              <SelectItem value="emergency_request">Emergency</SelectItem>
              <SelectItem value="prescription_created">Prescriptions</SelectItem>
              <SelectItem value="wallet_transaction">Wallet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="physician">Physician</SelectItem>
              <SelectItem value="hospital_admin">Hospital</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No user activities found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActivityTypeColor(activity.activity_type)}>
                      {activity.activity_type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getRoleColor(activity.user?.role || 'patient')}>
                      {activity.user?.role || 'Patient'}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  {activity.ip_address && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.ip_address}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>{activity.user?.first_name || ''} {activity.user?.last_name || ''}</strong> ({activity.user?.email || 'Unknown'})
                    </span>
                  </div>
                  
                  {activity.activity_details && Object.keys(activity.activity_details).length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      <strong>Details:</strong> {JSON.stringify(activity.activity_details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
