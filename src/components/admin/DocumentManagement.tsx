
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  document_url: string;
  verification_status: string;
  upload_date: string;
  user_email?: string;
  user_name?: string;
}

export const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Fetch physician documents
      const { data: physicianDocs, error: physicianError } = await supabase
        .from('physician_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      // Fetch regular documents
      const { data: regularDocs, error: regularError } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (physicianError && regularError) {
        console.error('Errors fetching documents:', { physicianError, regularError });
      }

      const allDocs = [
        ...(physicianDocs || []).map(doc => ({
          id: doc.id,
          document_name: doc.document_name,
          document_type: doc.document_type,
          document_url: doc.document_url,
          verification_status: doc.verification_status || 'pending',
          upload_date: doc.uploaded_at || new Date().toISOString()
        })),
        ...(regularDocs || []).map(doc => ({
          id: doc.id,
          document_name: doc.document_name,
          document_type: doc.document_type,
          document_url: doc.document_url,
          verification_status: doc.verification_status || 'pending',
          upload_date: doc.upload_date || new Date().toISOString()
        }))
      ];

      // Fetch user info for each document
      const docsWithUserInfo = await Promise.all(
        allDocs.map(async (doc) => {
          const userId = (physicianDocs || []).find(pd => pd.id === doc.id)?.physician_id ||
                        (regularDocs || []).find(rd => rd.id === doc.id)?.user_id;
          
          if (userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('id', userId)
              .single();
            
            return {
              ...doc,
              user_email: profile?.email,
              user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'
            };
          }
          return doc;
        })
      );

      setDocuments(docsWithUserInfo);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (docId: string, status: string) => {
    try {
      // Try updating physician_documents first
      const { error: physicianError } = await supabase
        .from('physician_documents')
        .update({
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', docId);

      // If not found in physician_documents, try documents table
      if (physicianError) {
        const { error: docError } = await supabase
          .from('documents')
          .update({
            verification_status: status,
            verified_at: status === 'verified' ? new Date().toISOString() : null
          })
          .eq('id', docId);

        if (docError) throw docError;
      }

      toast({
        title: "Success",
        description: `Document ${status} successfully.`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document status.",
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Management ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
            </div>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{document.document_name}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {document.document_type} | 
                      Uploaded: {new Date(document.upload_date).toLocaleDateString()}
                    </p>
                    {document.user_email && (
                      <p className="text-sm text-gray-500">
                        User: {document.user_name} ({document.user_email})
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(document.verification_status)}>
                    {document.verification_status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(document.document_url, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  
                  {document.verification_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateDocumentStatus(document.id, 'verified')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateDocumentStatus(document.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
