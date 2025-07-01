
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialDispute {
  id: string;
  user_id: string;
  transaction_id: string | null;
  dispute_type: string;
  description: string;
  amount: number | null;
  status: string;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  resolver?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const FinancialDisputes: React.FC = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<FinancialDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolvingDispute, setResolvingDispute] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      // First get the disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('financial_disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;

      // Then get user profiles for each dispute
      const disputesWithUsers = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', dispute.user_id)
            .single();

          let resolver = null;
          if (dispute.resolved_by) {
            const { data: resolverProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', dispute.resolved_by)
              .single();
            resolver = resolverProfile;
          }

          return {
            ...dispute,
            user: userProfile,
            resolver
          };
        })
      );

      setDisputes(disputesWithUsers);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load financial disputes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, status: 'resolved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('financial_disputes')
        .update({
          status,
          resolution_notes: resolutionNotes,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: 'financial_dispute_resolution',
        target_resource_type_param: 'financial_dispute',
        target_resource_id_param: disputeId,
        action_details_param: { resolution: status, notes: resolutionNotes }
      });

      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId 
          ? { 
              ...dispute, 
              status, 
              resolution_notes: resolutionNotes,
              resolved_at: new Date().toISOString()
            }
          : dispute
      ));

      setResolvingDispute(null);
      setResolutionNotes('');

      toast({
        title: "Dispute Resolved",
        description: `Dispute has been ${status}.`,
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive"
      });
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = searchTerm === '' || 
      dispute.dispute_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${dispute.user?.first_name || ''} ${dispute.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeColor = (type: string) => {
    switch (type) {
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'double_charge': return 'bg-orange-100 text-orange-800';
      case 'unauthorized_charge': return 'bg-purple-100 text-purple-800';
      case 'refund_request': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading financial disputes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Financial Disputes ({filteredDisputes.length})
        </CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search disputes or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDisputes.length === 0 ? (
          <div className="text-center py-6">
            <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No financial disputes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <div key={dispute.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getDisputeTypeColor(dispute.dispute_type)}>
                      {dispute.dispute_type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.toUpperCase()}
                    </Badge>
                    {dispute.amount && (
                      <span className="text-sm font-semibold text-green-600">
                        ₦{dispute.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(dispute.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-sm">
                    <strong>User:</strong> {dispute.user?.first_name || ''} {dispute.user?.last_name || ''} ({dispute.user?.email || 'Unknown'})
                  </p>
                  {dispute.transaction_id && (
                    <p className="text-sm">
                      <strong>Transaction ID:</strong> {dispute.transaction_id}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Description:</strong> {dispute.description}
                  </p>
                </div>

                {dispute.resolution_notes && (
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-sm"><strong>Resolution Notes:</strong> {dispute.resolution_notes}</p>
                    {dispute.resolver && (
                      <p className="text-xs text-gray-500 mt-1">
                        Resolved by: {dispute.resolver.first_name || ''} {dispute.resolver.last_name || ''} on {dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleString() : 'N/A'}
                      </p>
                    )}
                  </div>
                )}

                {dispute.status === 'pending' && (
                  <div className="space-y-3">
                    {resolvingDispute === dispute.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Resolution notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => resolveDispute(dispute.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => resolveDispute(dispute.id, 'rejected')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResolvingDispute(null);
                              setResolutionNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setResolvingDispute(dispute.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Review & Resolve
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
