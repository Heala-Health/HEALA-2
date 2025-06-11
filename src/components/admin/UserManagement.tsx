
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, X, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  verification_status: string;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch verification status from verification_requests table
      const usersWithStatus = await Promise.all(
        (data || []).map(async (user) => {
          const { data: verificationData } = await supabase
            .from('verification_requests')
            .select('status')
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...user,
            first_name: user.first_name || 'Unknown',
            last_name: user.last_name || 'User',
            verification_status: verificationData?.status || (user.role === 'patient' ? 'verified' : 'pending')
          };
        })
      );
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (userId: string, status: string) => {
    try {
      // Update or insert verification request
      const { error } = await supabase
        .from('verification_requests')
        .upsert({
          user_id: userId,
          request_type: 'manual_verification',
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${status} successfully.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive"
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">
                    {user.first_name} {user.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge className={getStatusColor(user.verification_status)}>
                    {user.verification_status}
                  </Badge>
                </div>
              </div>

              {user.verification_status === 'pending' && user.role !== 'patient' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateVerificationStatus(user.id, 'verified')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateVerificationStatus(user.id, 'rejected')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
