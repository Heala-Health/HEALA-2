
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const PhysicianRegistrationForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    specialization: '',
    licenseNumber: '',
    hospital: '',
    experience: '',
    education: ''
  });

  const specializations = [
    'General Practice', 'Internal Medicine', 'Cardiology', 'Dermatology',
    'Emergency Medicine', 'Family Medicine', 'Gastroenterology', 'Neurology',
    'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const requiredDocuments = [
    'Medical License',
    'Board Certification',
    'CV/Resume',
    'Medical School Diploma',
    'Professional References'
  ];

  const handleFileUpload = async (file: File, docType: string) => {
    try {
      // For demo purposes, we'll simulate file upload
      // In a real app, you'd upload to Supabase Storage
      const mockUrl = `https://example.com/docs/${Date.now()}-${file.name}`;
      
      const { error } = await supabase
        .from('physician_documents')
        .insert({
          physician_id: user?.id,
          document_type: docType,
          document_name: file.name,
          document_url: mockUrl,
          verification_status: 'pending'
        });

      if (error) throw error;

      setUploadedDocs(prev => [...prev, docType]);
      toast({
        title: "Document Uploaded",
        description: `${docType} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update profile with physician information
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'physician',
          specialization: formData.specialization,
          license_number: formData.licenseNumber
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Registration Submitted",
        description: "Your physician registration is under review. You'll be notified once approved.",
      });

    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Physician Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="specialization">Medical Specialization</Label>
              <Select 
                value={formData.specialization} 
                onValueChange={(value) => setFormData({ ...formData, specialization: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="licenseNumber">Medical License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="Enter your medical license number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hospital">Current Hospital/Practice</Label>
              <Input
                id="hospital"
                placeholder="Hospital or practice name"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="Years of medical practice"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !formData.specialization || !formData.licenseNumber}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocuments.map((docType) => (
              <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{docType}</span>
                  {uploadedDocs.includes(docType) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, docType);
                    }}
                    className="hidden"
                    id={`upload-${docType}`}
                  />
                  <Label htmlFor={`upload-${docType}`} className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadedDocs.includes(docType) ? 'Replace' : 'Upload'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              All documents must be uploaded and verified before your physician account is activated.
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB each).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
