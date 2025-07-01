
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Resource } from './ResourceCard';

export const useResourceData = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    if (!profile?.hospital_id) return;

    try {
      console.log('Fetching resources for hospital:', profile.hospital_id);
      
      // Using any type temporarily until Supabase types are regenerated
      const { data, error } = await (supabase as any)
        .from('hospital_resources')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Raw resource data:', data);

      const formattedData: Resource[] = (data || []).map((resource: any) => ({
        id: resource.id,
        name: resource.name,
        category: resource.category,
        total: resource.total_quantity,
        available: resource.available_quantity,
        inUse: resource.in_use_quantity,
        maintenance: resource.maintenance_quantity,
        status: resource.status as 'available' | 'limited' | 'critical'
      }));

      console.log('Formatted resource data:', formattedData);
      setResources(formattedData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addResource = async (resourceData: Omit<Resource, 'id'>) => {
    if (!profile?.hospital_id) return;

    try {
      console.log('Adding resource:', resourceData);
      
      const { error } = await (supabase as any)
        .from('hospital_resources')
        .insert({
          hospital_id: profile.hospital_id,
          name: resourceData.name,
          category: resourceData.category,
          total_quantity: resourceData.total,
          available_quantity: resourceData.available,
          in_use_quantity: resourceData.inUse,
          maintenance_quantity: resourceData.maintenance,
          status: resourceData.status
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource added successfully.",
      });
      
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: "Error",
        description: "Failed to add resource.",
        variant: "destructive"
      });
    }
  };

  const updateResource = async (resourceId: string, updates: Partial<Resource>) => {
    try {
      console.log('Updating resource:', { resourceId, updates });
      
      const { error } = await (supabase as any)
        .from('hospital_resources')
        .update({
          name: updates.name,
          category: updates.category,
          total_quantity: updates.total,
          available_quantity: updates.available,
          in_use_quantity: updates.inUse,
          maintenance_quantity: updates.maintenance,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource updated successfully.",
      });
      
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchResources();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('hospital_resources_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'hospital_resources',
          filter: `hospital_id=eq.${profile.hospital_id}`
        }, () => {
          console.log('Real-time update received for hospital_resources');
          fetchResources();
        })
        .subscribe();

      return () => {
        console.log('Cleaning up hospital_resources subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  return {
    resources,
    loading,
    addResource,
    updateResource,
    fetchResources
  };
};
