
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  submitted_at: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
}

export const VerificationCenter: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      // Fetch verification requests
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (verificationError) {
        console.error('Error fetching verification requests:', verificationError);
      }

      // Also fetch users who need verification based on their role and status
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, created_at')
        .in('role', ['physician', 'hospital_admin', 'agent'])
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine verification requests with profiles that need verification
      const allRequests = [
        ...(verificationData || []).map(req => ({
          id: req.id,
          user_id: req.user_id,
          request_type: req.request_type,
          status: req.status,
          submitted_at: req.submitted_at
        })),
        ...(profilesData || []).map(profile => ({
          id: `profile-${profile.id}`,
          user_id: profile.id,
          request_type: `${profile.role}_verification`,
          status: 'pending',
          submitted_at: profile.created_at
        }))
      ];

      // Fetch user details
      const requestsWithUserInfo = await Promise.all(
        allRequests.map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name, role')
            .eq('id', request.user_id)
            .single();

          return {
            ...request,
            user_email: profile?.email,
            user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
            user_role: profile?.role
          };
        })
      );

      // Remove duplicates based on user_id
      const uniqueRequests = requestsWithUserInfo.filter((request, index, self) =>
        index === self.findIndex(r => r.user_id === request.user_id)
      );

      setRequests(uniqueRequests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (userId: string, status: string) => {
    try {
      // Create or update verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .upsert({
          user_id: userId,
          request_type: 'profile_verification',
          status: status,
          reviewed_at: new Date().toISOString()
        });

      if (requestError) {
        console.error('Error updating verification request:', requestError);
      }

      toast({
        title: "Success",
        description: `User ${status} successfully.`,
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    return <UserCheck className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading verification requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Verification Center ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No verification requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getRequestTypeIcon(request.request_type)}
                    <div>
                      <h4 className="font-semibold">
                        {request.user_name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {request.user_email} | Role: {request.user_role}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {request.request_type} | 
                        Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateVerificationStatus(request.user_id, 'verified')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateVerificationStatus(request.user_id, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
