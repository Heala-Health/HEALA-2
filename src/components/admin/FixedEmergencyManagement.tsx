
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const FixedEmergencyManagement: React.FC = () => {
  const { toast } = useToast();
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetRole: 'all'
  });
  const [sending, setSending] = useState(false);

  const broadcastAlert = async () => {
    if (!alertData.title || !alertData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Get target users based on role filter
      let targetUsers = [];
      if (alertData.targetRole === 'all') {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true);
        targetUsers = allUsers || [];
      } else {
        // Cast the string to the proper role type
        const roleFilter = alertData.targetRole as 'patient' | 'physician' | 'hospital_admin' | 'agent' | 'admin';
        const { data: roleUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', roleFilter)
          .eq('is_active', true);
        targetUsers = roleUsers || [];
      }

      // Create notifications for each target user
      const notifications = targetUsers.map(user => ({
        user_id: user.id,
        title: alertData.title,
        message: alertData.message,
        type: alertData.type
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: 'emergency_broadcast',
        action_details_param: {
          title: alertData.title,
          message: alertData.message,
          target_role: alertData.targetRole,
          recipients_count: targetUsers.length
        }
      });

      toast({
        title: "Success",
        description: `Emergency alert broadcast to ${targetUsers.length} users.`,
      });

      setAlertData({
        title: '',
        message: '',
        type: 'info',
        targetRole: 'all'
      });
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      toast({
        title: "Error",
        description: "Failed to broadcast emergency alert.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Emergency Alert Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Alert Title</label>
          <Input
            value={alertData.title}
            onChange={(e) => setAlertData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter alert title..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Alert Message</label>
          <Textarea
            value={alertData.message}
            onChange={(e) => setAlertData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter alert message..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Alert Type</label>
            <Select 
              value={alertData.type} 
              onValueChange={(value) => setAlertData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Target Audience</label>
            <Select 
              value={alertData.targetRole} 
              onValueChange={(value) => setAlertData(prev => ({ ...prev, targetRole: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="patient">Patients</SelectItem>
                <SelectItem value="physician">Physicians</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="hospital_admin">Hospital Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={broadcastAlert} 
          disabled={sending}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Broadcasting...' : 'Broadcast Alert'}
        </Button>
      </CardContent>
    </Card>
  );
};
