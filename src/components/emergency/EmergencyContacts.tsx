import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, Plus, Edit, Trash2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export const EmergencyContacts: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    is_primary: false
  });

  useEffect(() => {
    if (user) {
      fetchEmergencyContacts();
    }
  }, [user]);

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts' as any)
        .select('*')
        .eq('patient_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      
      // Validate and filter data to ensure it matches our interface
      const validContacts = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 
        'id' in item && 'name' in item && 'relationship' in item && 'phone' in item
      ).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        name: item.name,
        relationship: item.relationship,
        phone: item.phone,
        email: item.email,
        is_primary: Boolean(item.is_primary),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setContacts(validContacts as EmergencyContact[]);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    try {
      const contactData = {
        patient_id: user?.id,
        name: formData.name,
        relationship: formData.relationship,
        phone: formData.phone,
        email: formData.email || null,
        is_primary: formData.is_primary
      };

      if (editingContact) {
        const { error } = await supabase
          .from('emergency_contacts' as any)
          .update(contactData)
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('emergency_contacts' as any)
          .insert(contactData);

        if (error) throw error;
      }

      toast({
        title: "Contact Saved",
        description: `Emergency contact ${editingContact ? 'updated' : 'added'} successfully.`
      });

      setIsDialogOpen(false);
      setEditingContact(null);
      setFormData({
        name: '',
        relationship: '',
        phone: '',
        email: '',
        is_primary: false
      });
      fetchEmergencyContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact",
        variant: "destructive"
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts' as any)
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Contact Deleted",
        description: "Emergency contact removed successfully."
      });

      fetchEmergencyContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email || '',
      is_primary: contact.is_primary
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      is_primary: false
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading emergency contacts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Emergency Contacts
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Contact's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({...prev, relationship: e.target.value}))}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    placeholder="contact@email.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData(prev => ({...prev, is_primary: e.target.checked}))}
                  />
                  <Label htmlFor="is_primary">Set as primary contact</Label>
                </div>
                <Button onClick={saveContact} className="w-full">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No emergency contacts added yet
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{contact.name}</h4>
                      {contact.is_primary && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{contact.relationship}</p>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </p>
                      {contact.email && (
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
