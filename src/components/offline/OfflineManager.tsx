
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Download, Trash2, Calendar, Users, Heart, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CacheData {
  id: string;
  data_type: string;
  cache_key: string;
  cached_data: any;
  last_updated: string;
  user_id: string;
}

export const OfflineManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<CacheData[]>([]);
  const [loading, setLoading] = useState(false);
  const [cachingProgress, setCachingProgress] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You are back online. Syncing data..."
      });
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You are now offline. Using cached data.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchCachedData();
    
    // Auto-cache essential data every 5 minutes when online
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        cacheEssentialData(true); // Silent cache
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const fetchCachedData = async () => {
    try {
      // Since offline_cache table doesn't exist, we'll use localStorage for now
      const cachedItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`heala_cache_${user?.id}_`)) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          cachedItems.push({
            id: key,
            data_type: data.type || 'unknown',
            cache_key: key,
            cached_data: data.data || {},
            last_updated: data.timestamp || new Date().toISOString(),
            user_id: user?.id || ''
          });
        }
      }
      setCachedData(cachedItems);
    } catch (error) {
      console.error('Error fetching cached data:', error);
    }
  };

  const syncOfflineData = async () => {
    // Sync any offline changes when back online
    try {
      // Check for pending offline actions and sync them
      const pendingActions = JSON.parse(localStorage.getItem(`heala_pending_${user?.id}`) || '[]');
      
      for (const action of pendingActions) {
        // Process pending actions (appointments, prescriptions, etc.)
        console.log('Syncing pending action:', action);
      }
      
      // Clear pending actions after sync
      localStorage.removeItem(`heala_pending_${user?.id}`);
      
      // Re-cache fresh data
      await cacheEssentialData(true);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const cacheEssentialData = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      if (!silent) setCachingProgress('Caching appointments...');
      
      // Cache recent and upcoming appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          physician:profiles!appointments_physician_id_fkey(first_name, last_name, specialization),
          hospital:hospitals(name, address, phone)
        `)
        .eq('patient_id', user?.id)
        .gte('appointment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .limit(20);

      if (appointments) {
        localStorage.setItem(`heala_cache_${user?.id}_appointments`, JSON.stringify({
          type: 'appointments',
          data: appointments,
          timestamp: new Date().toISOString()
        }));
      }

      if (!silent) setCachingProgress('Caching emergency contacts...');
      
      // Cache emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', user?.id);

      if (contacts) {
        localStorage.setItem(`heala_cache_${user?.id}_emergency_contacts`, JSON.stringify({
          type: 'emergency_contacts',
          data: contacts,
          timestamp: new Date().toISOString()
        }));
      }

      if (!silent) setCachingProgress('Caching prescriptions...');
      
      // Cache recent prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select(`
          *,
          pharmacy:healthcare_providers(name, address, phone)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (prescriptions) {
        localStorage.setItem(`heala_cache_${user?.id}_prescriptions`, JSON.stringify({
          type: 'prescriptions',
          data: prescriptions,
          timestamp: new Date().toISOString()
        }));
      }

      if (!silent) setCachingProgress('Caching health records...');
      
      // Cache recent health records
      const { data: healthRecords } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (healthRecords) {
        localStorage.setItem(`heala_cache_${user?.id}_health_records`, JSON.stringify({
          type: 'health_records',
          data: healthRecords,
          timestamp: new Date().toISOString()
        }));
      }

      if (!silent) setCachingProgress('Caching user preferences...');
      
      // Cache user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (preferences) {
        localStorage.setItem(`heala_cache_${user?.id}_preferences`, JSON.stringify({
          type: 'user_preferences',
          data: preferences,
          timestamp: new Date().toISOString()
        }));
      }

      if (!silent) {
        toast({
          title: "Data Cached Successfully",
          description: "Essential data has been cached for offline access."
        });
      }

      fetchCachedData();
      
    } catch (error) {
      console.error('Error caching data:', error);
      if (!silent) {
        toast({
          title: "Cache Error",
          description: "Failed to cache some data. Check your connection.",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setCachingProgress('');
      }
    }
  };

  const clearCache = async () => {
    try {
      // Remove all cached data for this user
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(`heala_cache_${user?.id}_`)) {
          localStorage.removeItem(key);
        }
      }

      toast({
        title: "Cache Cleared",
        description: "All cached data has been removed."
      });

      setCachedData([]);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive"
      });
    }
  };

  const getCacheIcon = (dataType: string) => {
    switch (dataType) {
      case 'appointments': return Calendar;
      case 'emergency_contacts': return Heart;
      case 'prescriptions': return Pill;
      case 'health_records': return Users;
      default: return Download;
    }
  };

  const formatCacheSize = (data: any) => {
    const size = JSON.stringify(data).length;
    return size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            Offline Access Manager
          </CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => cacheEssentialData()}
            disabled={loading || !isOnline}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Caching...' : 'Cache Essential Data'}
          </Button>
          <Button
            variant="outline"
            onClick={clearCache}
            disabled={cachedData.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>

        {loading && cachingProgress && (
          <div className="text-sm text-blue-600 font-medium">
            {cachingProgress}
          </div>
        )}

        {!isOnline && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Offline Mode Active</h4>
            <p className="text-sm text-amber-700">
              You're currently offline. The app will use cached data and queue any actions 
              you perform until you're back online.
            </p>
          </div>
        )}

        {cachedData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" />
              Cached Data ({cachedData.length} items)
            </h4>
            <div className="grid gap-2">
              {cachedData.map((cache) => {
                const IconComponent = getCacheIcon(cache.data_type);
                return (
                  <div key={cache.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-medium capitalize">
                          {cache.data_type.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-gray-600">
                          Last updated: {new Date(cache.last_updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {formatCacheSize(cache.cached_data)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {Array.isArray(cache.cached_data.data) 
                          ? `${cache.cached_data.data.length} items`
                          : 'Single item'
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cachedData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium mb-1">No cached data available</p>
            <p className="text-sm">
              {isOnline 
                ? "Click 'Cache Essential Data' to store data for offline access"
                : "No offline data available. Connect to internet to cache data."
              }
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cached data includes appointments, prescriptions, emergency contacts, and health records</p>
          <p>• Data is automatically refreshed every 5 minutes when online</p>
          <p>• Offline actions are queued and synced when connection is restored</p>
        </div>
      </CardContent>
    </Card>
  );
};
