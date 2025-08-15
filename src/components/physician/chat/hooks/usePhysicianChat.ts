
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Patient, Conversation } from '../types';

export const usePhysicianChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('role', 'patient')
        .eq('is_active', true);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients.",
        variant: "destructive"
      });
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // First get conversations
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('id, patient_id, physician_id, title, status, created_at')
        .eq('physician_id', user.id)
        .eq('type', 'physician_consultation')
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        return;
      }

      // Get patient names for each conversation
      const patientIds = conversationsData.map(conv => conv.patient_id);
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', patientIds);

      if (patientsError) throw patientsError;

      // Combine conversation data with patient names
      const conversationsWithNames = conversationsData.map(conv => {
        const patient = patientsData?.find(p => p.id === conv.patient_id);
        return {
          ...conv,
          patient_name: patient 
            ? `${patient.first_name} ${patient.last_name}`
            : 'Unknown Patient'
        };
      });

      setConversations(conversationsWithNames);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
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
          title: `Chat with ${patientName}`,
          type: 'physician_consultation',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPatients(), fetchConversations()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  return {
    patients,
    conversations,
    loading,
    startNewConversation,
    refreshConversations: fetchConversations
  };
};
