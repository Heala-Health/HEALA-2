
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MedicalDocument {
  id: string;
  document_name: string;
  document_type: string;
  document_category: string;
  upload_date: string;
  is_sensitive: boolean;
}

const DOCUMENT_CATEGORIES = [
  { value: 'lab_results', label: 'Lab Results' },
  { value: 'imaging', label: 'Medical Imaging' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'diagnosis', label: 'Diagnosis Reports' },
  { value: 'vaccination', label: 'Vaccination Records' },
  { value: 'surgery', label: 'Surgery Records' },
  { value: 'allergy', label: 'Allergy Information' },
  { value: 'other', label: 'Other Documents' }
];

export const MedicalHistoryUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_category: '',
    is_sensitive: false,
    notes: ''
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!uploadForm.document_name || !uploadForm.document_category) {
      toast({
        title: "Missing Information",
        description: "Please fill in document name and category before uploading.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the upload and store document metadata
      const documentData = {
        patient_id: user?.id,
        document_name: uploadForm.document_name,
        document_type: file.type,
        document_url: `fake-url-${Date.now()}`, // Would be actual storage URL
        document_category: uploadForm.document_category,
        is_sensitive: uploadForm.is_sensitive,
        metadata: {
          file_size: file.size,
          notes: uploadForm.notes
        }
      };

      const { error } = await supabase
        .from('medical_history_documents')
        .insert(documentData);

      if (error) throw error;

      toast({
        title: "Document Uploaded",
        description: "Your medical document has been uploaded successfully.",
      });

      // Reset form
      setUploadForm({
        document_name: '',
        document_category: '',
        is_sensitive: false,
        notes: ''
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [uploadForm, user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_history_documents')
        .select('*')
        .eq('patient_id', user?.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Medical Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_name">Document Name *</Label>
              <Input
                id="document_name"
                value={uploadForm.document_name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, document_name: e.target.value }))}
                placeholder="e.g., Blood Test Results"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document_category">Category *</Label>
              <Select
                value={uploadForm.document_category}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={uploadForm.notes}
              onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this document..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_sensitive"
              checked={uploadForm.is_sensitive}
              onChange={(e) => setUploadForm(prev => ({ ...prev, is_sensitive: e.target.checked }))}
            />
            <Label htmlFor="is_sensitive">Mark as sensitive information</Label>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {uploading ? (
              <p>Uploading...</p>
            ) : isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Drop your file here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, DOC, DOCX, and image files up to 10MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>My Medical Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-sm text-gray-500">
                        {DOCUMENT_CATEGORIES.find(cat => cat.value === doc.document_category)?.label}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded on {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.is_sensitive && (
                      <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
