
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const PhysicianRegistration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    specialization: '',
    license_number: '',
    phone: '',
    hospital_id: ''
  });

  const specializations = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery'
  ];

  const documentTypes = [
    'Medical License',
    'Board Certification',
    'Diploma',
    'CV/Resume',
    'Insurance Certificate'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const uploadDocument = async (file: File, documentType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${documentType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('physician-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('physician-documents')
      .getPublicUrl(fileName);

    // Store document info in database
    await supabase
      .from('physician_documents')
      .insert({
        physician_id: user?.id,
        document_type: documentType,
        document_name: file.name,
        document_url: publicUrl
      });

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          specialization: formData.specialization,
          license_number: formData.license_number,
          phone: formData.phone,
          hospital_id: formData.hospital_id || null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Upload documents
      for (let i = 0; i < documents.length; i++) {
        const documentType = documentTypes[i] || 'Other';
        await uploadDocument(documents[i], documentType);
      }

      toast({
        title: "Registration Updated",
        description: "Your physician profile has been updated successfully.",
      });

    } catch (error) {
      console.error('Error updating physician profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-6 h-6" />
          <span>Physician Registration</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">Medical License Number *</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) => handleInputChange('license_number', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documents">Upload Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload your medical license, certifications, and other documents
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="mt-2">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </Label>
              </div>
              {documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected files:</p>
                  <ul className="text-sm text-gray-600">
                    {documents.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            disabled={loading}
          >
            {loading ? 'Updating Profile...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
