
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  document_url: string;
  verification_status: string;
  upload_date: string;
}

export const PhysicianDocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: '',
    file: null as File | null
  });

  const documentTypes = [
    'Medical License',
    'Board Certification',
    'Diploma',
    'CV/Resume',
    'Insurance Certificate',
    'ID Document'
  ];

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const uploadDocument = async () => {
    if (!user || !uploadData.file || !uploadData.document_type) {
      toast({
        title: "Error",
        description: "Please select a document type and file.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${user.id}/${uploadData.document_type}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('physician-documents')
        .upload(fileName, uploadData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('physician-documents')
        .getPublicUrl(fileName);

      // Save document info to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: uploadData.document_type,
          document_name: uploadData.file.name,
          document_url: publicUrl,
          verification_status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });

      setUploadData({ document_type: '', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Document Upload & Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="document_type">Document Type</Label>
            <Select value={uploadData.document_type} onValueChange={(value) => setUploadData({ ...uploadData, document_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Upload Document</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
            />
          </div>

          <Button onClick={uploadDocument} disabled={loading || !uploadData.file || !uploadData.document_type}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.verification_status)}
                    <div>
                      <p className="font-medium">{doc.document_type}</p>
                      <p className="text-sm text-gray-500">{doc.document_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize">{doc.verification_status}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
