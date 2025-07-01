
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, Conversation } from '../types';

export const usePhysicianChat = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
    fetchConversations();
  }, []);

  const fetchPatients = async () => {
    try {
      // Get patients assigned to this physician
      const { data: assignedPatients, error: assignmentError } = await supabase
        .from('physician_patients')
        .select('patient_id')
        .eq('physician_id', user?.id)
        .eq('status', 'active');

      if (assignmentError) throw assignmentError;

      if (!assignedPatients || assignedPatients.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      const patientIds = assignedPatients.map(p => p.patient_id);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', patientIds)
        .eq('role', 'patient');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('physician_id', user?.id)
        .eq('type', 'physician_consultation')
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      const conversationsWithPatients = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', conv.patient_id)
            .single();

          return {
            id: conv.id,
            patient_id: conv.patient_id,
            physician_id: conv.physician_id,
            title: conv.title,
            status: conv.status,
            created_at: conv.created_at,
            patient_name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Unknown Patient'
          };
        })
      );

      setConversations(conversationsWithPatients);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startNewConversation = async (patientId: string, patientName: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          physician_id: user.id,
          type: 'physician_consultation',
          title: `Consultation with Dr. ${user.user_metadata?.first_name || 'Physician'}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'physician',
          sender_id: user.id,
          content: `Hello ${patientName}! I'm ready to help you with your health concerns. How can I assist you today?`
        });

      fetchConversations();
      return data.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  };

  return {
    patients,
    conversations,
    loading,
    startNewConversation,
    refetchConversations: fetchConversations
  };
};
