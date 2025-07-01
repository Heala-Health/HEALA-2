
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  expiryDate?: string;
  tags: string[];
}

export const HospitalDocumentManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Mock data for demonstration
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Medical License Certificate',
          type: 'PDF',
          category: 'License',
          size: 2456789,
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-06-10T10:30:00Z',
          status: 'approved',
          confidentiality: 'public',
          expiryDate: '2025-06-10',
          tags: ['license', 'medical', 'certification']
        },
        {
          id: '2',
          name: 'Hospital Accreditation Report',
          type: 'PDF',
          category: 'Compliance',
          size: 5678901,
          uploadedBy: 'Admin John Doe',
          uploadedAt: '2024-06-08T14:15:00Z',
          status: 'approved',
          confidentiality: 'internal',
          tags: ['accreditation', 'compliance', 'report']
        },
        {
          id: '3',
          name: 'Insurance Policy Document',
          type: 'PDF',
          category: 'Insurance',
          size: 3456789,
          uploadedBy: 'Admin John Doe',
          uploadedAt: '2024-06-05T09:45:00Z',
          status: 'pending',
          confidentiality: 'confidential',
          expiryDate: '2025-12-31',
          tags: ['insurance', 'policy', 'coverage']
        },
        {
          id: '4',
          name: 'Staff Training Manual',
          type: 'PDF',
          category: 'Training',
          size: 8901234,
          uploadedBy: 'HR Manager',
          uploadedAt: '2024-06-01T16:20:00Z',
          status: 'approved',
          confidentiality: 'internal',
          tags: ['training', 'manual', 'staff']
        },
        {
          id: '5',
          name: 'Emergency Response Plan',
          type: 'DOCX',
          category: 'Emergency',
          size: 1234567,
          uploadedBy: 'Emergency Coordinator',
          uploadedAt: '2024-05-28T11:00:00Z',
          status: 'approved',
          confidentiality: 'restricted',
          tags: ['emergency', 'response', 'plan']
        }
      ];
      setDocuments(mockDocuments);
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

  const handleUpload = async () => {
    toast({
      title: "Upload Started",
      description: "Document upload functionality will be implemented with file storage.",
    });
  };

  const handleDownload = (document: Document) => {
    toast({
      title: "Download Started",
      description: `Downloading ${document.name}...`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-orange-100 text-orange-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(documents.map(doc => doc.category)))];
  const statuses = ['all', 'pending', 'approved', 'rejected'];

  if (loading) {
    return <div className="p-6">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Document Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Document Management
            <Button onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                  <div>
                    <h4 className="font-medium">{document.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {document.type} • {(document.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <Badge variant="outline">{document.category}</Badge>
                      <Badge className={getConfidentialityColor(document.confidentiality)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {document.confidentiality}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        Uploaded by {document.uploadedBy}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </span>
                      {document.expiryDate && (
                        <span className="text-xs text-orange-600">
                          Expires: {new Date(document.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {document.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(document.status)}
                    <span className="text-sm capitalize">{document.status}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(document)}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(document)}>
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
