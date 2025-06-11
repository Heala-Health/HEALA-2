import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, FileText, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  user_id: string;
  document_name: string;
  document_type: string;
  document_url: string;
  verification_status: string;
  upload_date: string;
  verified_at?: string;
  verified_by?: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface VerificationRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export const AdminVerificationCenter: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchVerificationRequests();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          user_id,
          document_name,
          document_type,
          document_url,
          verification_status,
          upload_date,
          verified_at,
          verified_by
        `)
        .eq('verification_status', 'pending')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const documentsWithProfiles = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, role')
            .eq('id', doc.user_id)
            .single();

          return {
            ...doc,
            user_profile: profile || {
              first_name: 'Unknown',
              last_name: 'User',
              email: 'unknown@example.com',
              role: 'patient'
            }
          };
        })
      );

      setDocuments(documentsWithProfiles);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          id,
          user_id,
          request_type,
          status,
          submitted_at,
          reviewed_at,
          reviewed_by,
          notes
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, role')
            .eq('id', req.user_id)
            .single();

          return {
            ...req,
            user_profile: profile || {
              first_name: 'Unknown',
              last_name: 'User',
              email: 'unknown@example.com',
              role: 'patient'
            }
          };
        })
      );

      setVerificationRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentVerification = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document Verified",
        description: `Document has been ${status}.`
      });

      setIsDialogOpen(false);
      setSelectedDocument(null);
      setVerificationNotes('');
      fetchDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        title: "Error",
        description: "Failed to verify document",
        variant: "destructive"
      });
    }
  };

  const handleRequestVerification = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          notes: verificationNotes
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Processed",
        description: `Verification request has been ${status}.`
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process verification request",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading verification center...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Verification Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents">
                Document Verification ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                User Requests ({verificationRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No pending document verifications
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{doc.document_name}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            Type: {doc.document_type}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Uploaded by: {doc.user_profile?.first_name} {doc.user_profile?.last_name} ({doc.user_profile?.role})
                          </p>
                          <p className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date(doc.upload_date).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(doc.verification_status)}>
                          {doc.verification_status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.document_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Dialog open={isDialogOpen && selectedDocument?.id === doc.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Verify Document</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Document: {doc.document_name}</Label>
                                <p className="text-sm text-gray-600">Type: {doc.document_type}</p>
                              </div>
                              <div>
                                <Label htmlFor="notes">Verification Notes (Optional)</Label>
                                <Textarea
                                  id="notes"
                                  value={verificationNotes}
                                  onChange={(e) => setVerificationNotes(e.target.value)}
                                  placeholder="Add any notes about the verification..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleDocumentVerification(doc.id, 'approved')}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleDocumentVerification(doc.id, 'rejected')}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {verificationRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No pending verification requests
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{request.request_type}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            Requested by: {request.user_profile?.first_name} {request.user_profile?.last_name} ({request.user_profile?.role})
                          </p>
                          <p className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date(request.submitted_at).toLocaleString()}
                          </p>
                          {request.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              Notes: {request.notes}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRequestVerification(request.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRequestVerification(request.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
