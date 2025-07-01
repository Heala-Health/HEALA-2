
import React, { useEffect, useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatHeaderSectionProps {
  onBack: () => void;
  conversationId?: string;
}

interface ContactInfo {
  first_name: string;
  last_name: string;
  specialization?: string;
  role: string;
}

export const ChatHeaderSection: React.FC<ChatHeaderSectionProps> = ({ onBack, conversationId }) => {
  const { user, profile } = useAuth();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [conversationType, setConversationType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (!conversationId || !user) return;

      try {
        // Get conversation details
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('physician_id, patient_id, type')
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;

        setConversationType(conversation.type);

        // Determine which user is the contact based on conversation type and current user role
        let contactId = null;
        
        if (conversation.type === 'agent_support') {
          // For agent support, if current user is patient, contact is agent (but we don't have a specific agent ID)
          // If current user is agent, contact is patient
          contactId = profile?.role === 'patient' ? null : conversation.patient_id;
        } else {
          // For physician consultations, contact is the other party
          contactId = profile?.role === 'patient' 
            ? conversation.physician_id 
            : conversation.patient_id;
        }

        if (contactId) {
          // Fetch contact profile
          const { data: contactData, error: contactError } = await supabase
            .from('profiles')
            .select('first_name, last_name, specialization, role')
            .eq('id', contactId)
            .single();

          if (contactError) throw contactError;
          setContactInfo(contactData);
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, [conversationId, user, profile]);

  const getDisplayName = () => {
    if (loading) return 'Loading...';
    
    if (conversationType === 'agent_support') {
      if (profile?.role === 'patient') {
        return 'Healthcare Agent';
      } else if (contactInfo) {
        const fullName = `${contactInfo.first_name || ''} ${contactInfo.last_name || ''}`.trim();
        return fullName || 'Patient';
      }
      return 'Patient';
    }
    
    if (contactInfo) {
      const fullName = `${contactInfo.first_name || ''} ${contactInfo.last_name || ''}`.trim();
      return profile?.role === 'patient' 
        ? `Dr. ${fullName}` 
        : fullName;
    }
    
    return profile?.role === 'patient' ? 'Physician' : 'Patient';
  };

  const getSubtitle = () => {
    if (loading || !contactInfo) return '';
    
    if (conversationType === 'agent_support') {
      return profile?.role === 'patient' ? 'Healthcare Support' : 'Patient Support';
    }
    
    return profile?.role === 'patient' ? contactInfo.specialization : 'Patient';
  };

  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">{getDisplayName()}</CardTitle>
            {getSubtitle() && (
              <p className="text-sm text-gray-600">{getSubtitle()}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
  );
};
