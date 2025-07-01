
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Prescription, PrescriptionStatus } from '../types/prescription';

export const usePrescriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      console.log('Fetching prescriptions for patient:', user?.id);
      
      // Get prescriptions first
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('Error fetching prescriptions:', prescriptionsError);
        throw prescriptionsError;
      }

      console.log('Fetched prescriptions:', prescriptionsData);

      if (!prescriptionsData || prescriptionsData.length === 0) {
        setPrescriptions([]);
        return;
      }

      // Get unique physician and pharmacy IDs
      const physicianIds = [...new Set(prescriptionsData.map(p => p.physician_id))];
      const pharmacyIds = [...new Set(prescriptionsData.map(p => p.pharmacy_id).filter(Boolean))];

      // Fetch physician profiles
      const { data: physicians } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .in('id', physicianIds);

      // Fetch pharmacy data
      const { data: pharmacies } = pharmacyIds.length > 0 ? await supabase
        .from('healthcare_providers')
        .select('id, name, address, phone')
        .in('id', pharmacyIds) : { data: [] };

      // Combine data and ensure proper typing
      const enrichedPrescriptions: Prescription[] = prescriptionsData.map(prescription => {
        const physician = physicians?.find(p => p.id === prescription.physician_id);
        const pharmacy = pharmacies?.find(p => p.id === prescription.pharmacy_id);

        return {
          ...prescription,
          status: prescription.status as PrescriptionStatus,
          physician: physician ? {
            first_name: physician.first_name || 'Unknown',
            last_name: physician.last_name || 'Doctor',
            specialization: physician.specialization
          } : {
            first_name: 'Unknown',
            last_name: 'Doctor',
            specialization: undefined
          },
          pharmacy: pharmacy
        };
      });

      console.log('Enriched prescriptions:', enrichedPrescriptions);
      setPrescriptions(enrichedPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    prescriptions,
    loading,
    refetch: fetchPrescriptions
  };
};
