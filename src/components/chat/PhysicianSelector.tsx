
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  is_active: boolean;
}

interface PhysicianSelectorProps {
  onSelect: (physicianId: string, physicianName: string) => void;
  onBack: () => void;
}

export const PhysicianSelector: React.FC<PhysicianSelectorProps> = ({ onSelect, onBack }) => {
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [filteredPhysicians, setFilteredPhysicians] = useState<Physician[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhysicians();
  }, []);

  useEffect(() => {
    const filtered = physicians.filter(physician =>
      physician.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPhysicians(filtered);
  }, [searchTerm, physicians]);

  const fetchPhysicians = async () => {
    try {
      console.log('Fetching physicians for chat selector...');
      
      // First try the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_physicians');
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log('Physicians fetched via RPC:', rpcData.length);
        const formattedPhysicians = rpcData.map((physician: any) => ({
          id: physician.id,
          first_name: physician.first_name || '',
          last_name: physician.last_name || '',
          specialization: physician.specialization || 'General Practice',
          hospital_name: physician.hospital_name || 'Independent Practice',
          is_active: true
        }));
        setPhysicians(formattedPhysicians);
        setFilteredPhysicians(formattedPhysicians);
        setLoading(false);
        return;
      }

      console.log('RPC failed, trying direct query...');
      
      // Fallback to direct query
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          specialization,
          is_active,
          hospitals!inner(name)
        `)
        .eq('role', 'physician')
        .eq('is_active', true);

      if (error) {
        console.error('Error in direct query:', error);
        throw error;
      }

      const formattedPhysicians = (data || []).map(physician => ({
        id: physician.id,
        first_name: physician.first_name || '',
        last_name: physician.last_name || '',
        specialization: physician.specialization || 'General Practice',
        hospital_name: (physician.hospitals as any)?.name || 'Independent Practice',
        is_active: physician.is_active
      }));

      console.log('Physicians fetched directly:', formattedPhysicians.length);
      setPhysicians(formattedPhysicians);
      setFilteredPhysicians(formattedPhysicians);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast({
        title: "Error",
        description: "Failed to load physicians.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (physician: Physician) => {
    const fullName = `Dr. ${physician.first_name} ${physician.last_name}`;
    onSelect(physician.id, fullName);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading physicians...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Select a Physician</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, specialty, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredPhysicians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No physicians found matching your search.' : 'No physicians available at the moment.'}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchPhysicians}
                className="mt-4 block mx-auto"
              >
                Refresh Physicians
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPhysicians.map((physician) => (
                <div
                  key={physician.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleSelect(physician)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Dr. {physician.first_name} {physician.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{physician.specialization}</p>
                        <p className="text-xs text-gray-500">{physician.hospital_name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Available
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
