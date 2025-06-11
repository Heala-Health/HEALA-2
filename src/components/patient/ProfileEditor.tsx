
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, User, Heart, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface PatientProfile {
  hobbies: string[];
  health_challenges: string[];
  medical_history: any;
  emergency_contact: EmergencyContact;
}

export const ProfileEditor: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PatientProfile>({
    hobbies: [],
    health_challenges: [],
    medical_history: {},
    emergency_contact: { name: '', phone: '', relation: '' }
  });

  const [newHobby, setNewHobby] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const emergencyContact = data.emergency_contact as unknown;
        
        // Safe type checking for emergency contact
        let parsedEmergencyContact: EmergencyContact = { name: '', phone: '', relation: '' };
        if (emergencyContact && typeof emergencyContact === 'object' && emergencyContact !== null) {
          const contact = emergencyContact as Record<string, unknown>;
          parsedEmergencyContact = {
            name: typeof contact.name === 'string' ? contact.name : '',
            phone: typeof contact.phone === 'string' ? contact.phone : '',
            relation: typeof contact.relation === 'string' ? contact.relation : ''
          };
        }

        setProfile({
          hobbies: data.hobbies || [],
          health_challenges: data.health_challenges || [],
          medical_history: data.medical_history || {},
          emergency_contact: parsedEmergencyContact
        });

        setEmergencyName(parsedEmergencyContact.name);
        setEmergencyPhone(parsedEmergencyContact.phone);
        setEmergencyRelation(parsedEmergencyContact.relation);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        hobbies: profile.hobbies,
        health_challenges: profile.health_challenges,
        medical_history: profile.medical_history,
        emergency_contact: {
          name: emergencyName,
          phone: emergencyPhone,
          relation: emergencyRelation
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('patient_profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addHobby = () => {
    if (newHobby.trim() && !profile.hobbies.includes(newHobby.trim())) {
      setProfile(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, newHobby.trim()]
      }));
      setNewHobby('');
    }
  };

  const removeHobby = (hobby: string) => {
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addChallenge = () => {
    if (newChallenge.trim() && !profile.health_challenges.includes(newChallenge.trim())) {
      setProfile(prev => ({
        ...prev,
        health_challenges: [...prev.health_challenges, newChallenge.trim()]
      }));
      setNewChallenge('');
    }
  };

  const removeChallenge = (challenge: string) => {
    setProfile(prev => ({
      ...prev,
      health_challenges: prev.health_challenges.filter(c => c !== challenge)
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Hobbies & Interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a hobby..."
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHobby()}
            />
            <Button onClick={addHobby}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((hobby, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {hobby}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeHobby(hobby)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Health Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a health challenge..."
              value={newChallenge}
              onChange={(e) => setNewChallenge(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addChallenge()}
            />
            <Button onClick={addChallenge}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.health_challenges.map((challenge, index) => (
              <Badge key={index} variant="destructive" className="gap-1">
                {challenge}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeChallenge(challenge)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency-name">Name</Label>
            <Input
              id="emergency-name"
              placeholder="Emergency contact name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emergency-phone">Phone</Label>
            <Input
              id="emergency-phone"
              placeholder="Emergency contact phone"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="emergency-relation">Relationship</Label>
            <Input
              id="emergency-relation"
              placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveProfile} disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
};
