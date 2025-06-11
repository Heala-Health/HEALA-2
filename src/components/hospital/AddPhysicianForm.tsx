
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AddPhysicianForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    license_number: ''
  });

  const specialties = [
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPhysician = async () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: 'physician',
          specialization: formData.specialization,
          license_number: formData.license_number
        }
      });

      if (authError) {
        // If admin API not available, try regular signup
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
              role: 'physician',
              specialization: formData.specialization,
              license_number: formData.license_number
            }
          }
        });

        if (signupError) throw signupError;
        
        // If signup successful, manually insert into profiles
        if (signupData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signupData.user.id,
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
              role: 'physician',
              specialization: formData.specialization,
              license_number: formData.license_number
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Physician added successfully!",
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        specialization: '',
        license_number: ''
      });

    } catch (error: any) {
      console.error('Error adding physician:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add physician. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New Physician
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter first name"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <Label htmlFor="specialization">Specialization</Label>
          <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="license_number">Medical License Number</Label>
          <Input
            id="license_number"
            value={formData.license_number}
            onChange={(e) => handleInputChange('license_number', e.target.value)}
            placeholder="Enter license number"
          />
        </div>

        <Button onClick={addPhysician} disabled={loading} className="w-full">
          {loading ? 'Adding Physician...' : 'Add Physician'}
        </Button>
      </CardContent>
    </Card>
  );
};
