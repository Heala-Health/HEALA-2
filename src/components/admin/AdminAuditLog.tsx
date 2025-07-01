
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Users, Shield, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  action_details: any;
  ip_address: string | null;
  created_at: string;
  admin: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  target_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const AdminAuditLog: React.FC = () => {
  const { toast } = useToast();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // days

  useEffect(() => {
    fetchAuditLog();
  }, [dateRange]);

  const fetchAuditLog = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch admin and target user details manually
      const actionsWithDetails = await Promise.all(
        (data || []).map(async (action) => {
          // Fetch admin profile
          let admin = null;
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', action.admin_id)
            .single();
          
          if (adminProfile) {
            admin = adminProfile;
          }

          // Fetch target user if exists
          let target_user = null;
          if (action.target_user_id) {
            const { data: targetUserProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', action.target_user_id)
              .single();
            
            if (targetUserProfile) {
              target_user = targetUserProfile;
            }
          }

          return {
            ...action,
            ip_address: action.ip_address as string | null,
            admin,
            target_user
          };
        })
      );

      setActions(actionsWithDetails);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      toast({
        title: "Error",
        description: "Failed to load audit log.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLog = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .csv();

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Audit log has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting audit log:', error);
      toast({
        title: "Error",
        description: "Failed to export audit log.",
        variant: "destructive"
      });
    }
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = searchTerm === '' || 
      action.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.admin?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.target_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = actionTypeFilter === 'all' || action.action_type === actionTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'user_verification': return 'bg-green-100 text-green-800';
      case 'user_suspension': return 'bg-red-100 text-red-800';
      case 'user_activation': return 'bg-blue-100 text-blue-800';
      case 'system_setting_update': return 'bg-purple-100 text-purple-800';
      case 'emergency_override': return 'bg-orange-100 text-orange-800';
      case 'financial_dispute_resolution': return 'bg-yellow-100 text-yellow-800';
      case 'hospital_verification': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading audit log...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Admin Audit Log ({filteredActions.length})
          </CardTitle>
          <Button onClick={exportAuditLog} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search actions, admin, or target user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_verification">User Verification</SelectItem>
              <SelectItem value="user_suspension">User Suspension</SelectItem>
              <SelectItem value="user_activation">User Activation</SelectItem>
              <SelectItem value="system_setting_update">System Updates</SelectItem>
              <SelectItem value="emergency_override">Emergency Override</SelectItem>
              <SelectItem value="financial_dispute_resolution">Financial Disputes</SelectItem>
              <SelectItem value="hospital_verification">Hospital Verification</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No audit log entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <div key={action.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionTypeColor(action.action_type)}>
                      {action.action_type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                  {action.ip_address && (
                    <span className="text-xs text-gray-400">IP: {action.ip_address}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      Admin: <strong>{action.admin?.first_name || ''} {action.admin?.last_name || ''}</strong> ({action.admin?.email || 'Unknown'})
                    </span>
                  </div>
                  
                  {action.target_user && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        Target: <strong>{action.target_user.first_name || ''} {action.target_user.last_name || ''}</strong> ({action.target_user.email})
                      </span>
                    </div>
                  )}
                  
                  {action.action_details && Object.keys(action.action_details).length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      <strong>Details:</strong> {JSON.stringify(action.action_details, null, 2)}
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
