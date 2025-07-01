
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  city: string;
  state: string;
  is_active: boolean;
}

export const ContactAgent: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [searchTerm, agents]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, location, city, state, is_active, role')
        .eq('role', 'agent')
        .order('first_name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Filter for active agents and provide defaults for missing data
      const activeAgents = (data || [])
        .filter(agent => agent.is_active !== false) // Include null/undefined as active
        .map(agent => ({
          ...agent,
          first_name: agent.first_name || 'Unknown',
          last_name: agent.last_name || 'Agent',
          phone: agent.phone || 'Not available',
          location: agent.location || 'Not specified',
          city: agent.city || 'Not specified',
          state: agent.state || 'Not specified'
        })) as Agent[];

      setAgents(activeAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    if (!searchTerm.trim()) {
      setFilteredAgents(agents);
      return;
    }

    const filtered = agents.filter(agent => 
      agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredAgents(filtered);
  };

  const handleCallAgent = (phone: string, agentName: string) => {
    if (phone === 'Not available') {
      toast({
        title: "Phone Not Available",
        description: `${agentName} has not provided a phone number.`,
        variant: "destructive"
      });
      return;
    }

    // For web, we can use tel: protocol which will open the default phone app on mobile
    // or show the number for desktop users to dial manually
    window.location.href = `tel:${phone}`;
    
    toast({
      title: "Calling Agent",
      description: `Initiating call to ${agentName} at ${phone}`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading agents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact an Agent
          </CardTitle>
          <p className="text-sm text-gray-600">
            Get assistance from our registered agents. Call them directly for help with appointments, 
            transport booking, or any other support you need.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? 'No agents found' : 'No agents available'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms to find agents in your area.'
                  : 'There are currently no agents registered in the system.'
                }
              </p>
              {agents.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  Found {agents.length} total agents, but none match your search.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {agent.first_name} {agent.last_name}
                      </h3>
                      <Badge variant="secondary" className="mt-1">
                        Agent
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {agent.city !== 'Not specified' && agent.state !== 'Not specified' 
                          ? `${agent.city}, ${agent.state}`
                          : agent.location
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{agent.phone}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleCallAgent(agent.phone, `${agent.first_name} ${agent.last_name}`)}
                    className="w-full"
                    disabled={agent.phone === 'Not available'}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-800 mb-3">
                Our agents are here to assist you with:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Booking appointments with physicians</li>
                <li>• Arranging transport to medical facilities</li>
                <li>• Navigating the platform</li>
                <li>• Emergency assistance coordination</li>
                <li>• General healthcare support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
