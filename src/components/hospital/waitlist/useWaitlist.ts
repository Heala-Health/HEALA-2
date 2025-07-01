
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WaitlistEntry } from './types';
import { fetchProfilesByIds } from './utils';

export const useWaitlist = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('patient_waitlist')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const patientIds = [...new Set((data || []).map(row => row.patient_id))];
      const profilesMap = await fetchProfilesByIds(patientIds);

      const formattedData: WaitlistEntry[] = (data || []).map(entry => {
        const p = profilesMap[entry.patient_id] || { first_name: '', last_name: '', phone: '' };
        return {
          id: entry.id,
          patient_id: entry.patient_id,
          department: entry.department,
          priority: entry.priority as 'low' | 'medium' | 'high' | 'urgent',
          reason: entry.reason,
          estimated_wait_time: entry.estimated_wait_time || 0,
          status: entry.status as 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled',
          created_at: entry.created_at,
          patient_name: (p.first_name || p.last_name) ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown Patient',
          patient_phone: p.phone || ''
        };
      });

      setWaitlist(formattedData);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast({
        title: "Error",
        description: "Failed to load waitlist.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEntryStatus = async (entryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patient_waitlist')
        .update({ 
          status: newStatus,
          called_at: newStatus === 'called' ? new Date().toISOString() : null,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Patient status updated to ${newStatus}.`,
      });
      
      fetchWaitlist();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update patient status.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchWaitlist();
      
      const channel = supabase
        .channel('waitlist_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'patient_waitlist',
          filter: `hospital_id=eq.${profile.hospital_id}`
        }, () => {
          fetchWaitlist();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  return {
    waitlist,
    loading,
    updateEntryStatus,
    fetchWaitlist
  };
};
