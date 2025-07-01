import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Phone, Mail, Shield, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HospitalProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  is_active: boolean;
  verification_documents: any;
  security_settings: any;
}

export const HospitalProfileManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [hospitalData, setHospitalData] = useState<HospitalProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchHospitalProfile();
    }
  }, [profile?.hospital_id]);

  const fetchHospitalProfile = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', profile.hospital_id)
        .single();

      if (error) throw error;
      
      // Transform the data to match our interface
      const hospitalProfile: HospitalProfile = {
        id: data.id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone,
        email: data.email,
        latitude: data.latitude,
        longitude: data.longitude,
        verification_status: data.verification_status,
        is_active: data.is_active,
        verification_documents: data.verification_documents || [],
        security_settings: data.security_settings || {}
      };
      
      setHospitalData(hospitalProfile);
    } catch (error) {
      console.error('Error fetching hospital profile:', error);
      toast({
        title: "Error",
        description: "Failed to load hospital profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hospitalData || !profile?.hospital_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({
          name: hospitalData.name,
          address: hospitalData.address,
          city: hospitalData.city,
          state: hospitalData.state,
          phone: hospitalData.phone,
          email: hospitalData.email
        })
        .eq('id', profile.hospital_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hospital profile updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating hospital profile:', error);
      toast({
        title: "Error",
        description: "Failed to update hospital profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof HospitalProfile, value: string) => {
    if (hospitalData) {
      setHospitalData({ ...hospitalData, [field]: value });
    }
  };

  if (loading) {
    return <div className="p-6">Loading hospital profile...</div>;
  }

  if (!hospitalData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Hospital profile not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Hospital Profile
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={hospitalData.is_active ? "default" : "destructive"}>
                {hospitalData.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                {hospitalData.verification_status}
              </Badge>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Hospital Name</Label>
                <Input
                  id="name"
                  value={hospitalData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={hospitalData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={hospitalData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={hospitalData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={hospitalData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={hospitalData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Coordinates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <p className="text-sm text-gray-600">
                  {hospitalData.latitude || 'Not set'}
                </p>
              </div>
              <div>
                <Label>Longitude</Label>
                <p className="text-sm text-gray-600">
                  {hospitalData.longitude || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm">Two-Factor Auth</h5>
                <p className="text-xs text-gray-600 mt-1">
                  {hospitalData.security_settings?.two_factor_required ? 'Required' : 'Optional'}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm">Session Timeout</h5>
                <p className="text-xs text-gray-600 mt-1">
                  {hospitalData.security_settings?.session_timeout || 3600} seconds
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium text-sm">IP Whitelist</h5>
                <p className="text-xs text-gray-600 mt-1">
                  {hospitalData.security_settings?.ip_whitelist?.length || 0} addresses
                </p>
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Verification Documents
            </h4>
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Document management coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Current documents: {Array.isArray(hospitalData.verification_documents) ? hospitalData.verification_documents.length : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
