import React from 'react'; // Removed useState, useEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, MapPin } from 'lucide-react'; // Added MapPin
// Removed supabase import
// Removed useToast import

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  location: string; // Added location
}

// Hardcoded agent data
const staticAgents: Agent[] = [
  { id: '1', first_name: 'Mrs.', last_name: 'Boluwatife', phone: '+234 901 468 2944', email: 'boluwatife.agent@heala.com', location: 'Veritas University Bwari Abuja' },
  { id: '2', first_name: 'Mr.', last_name: 'Isaac', phone: '+234 901 468 2944', email: 'isaac.agent@heala.com', location: 'Bwari Market' },
  { id: '3', first_name: 'Mr.', last_name: 'Damian', phone: '+234 814 971 1240', email: 'damian.agent@heala.com', location: 'Viva Hospital Bwari' },
  { id: '4', first_name: 'Miss', last_name: 'Stephaine', phone: '+234 913 221 5717', email: 'stephaine.agent@heala.com', location: 'Kogo 2 Mosque, Zago Ave' },
  { id: '5', first_name: 'Mr.', last_name: 'Ayomide', phone: '+234 913 221 5717', email: 'ayomide.agent@heala.com', location: 'Kogo Phase 1 Extension' },
  { id: '6', first_name: 'Miss', last_name: 'Sarah', phone: '+234 707 039 0108', email: 'sarah.agent@heala.com', location: 'Unity College of Nursing Science Bwari' },
  { id: '7', first_name: 'Miss', last_name: 'Abayomi', phone: '+234 906 709 4071', email: 'abayomi.agent@heala.com', location: 'De Rock Hospital and Diagnostics Centre, Bwari' },
];

export const AgentContactInfo: React.FC = () => {
  // Removed useToast and loading state as data is static
  // const { toast } = useToast();
  // const [loading, setLoading] = useState(true);

  // Removed useEffect and fetchAgents as data is static
  // useEffect(() => {
  //   fetchAgents();
  // }, []);

  // const fetchAgents = async () => { /* ... */ };

  // Removed loading check
  // if (loading) { /* ... */ }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact an Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {staticAgents.length === 0 ? (
          <div className="text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No agents available for contact at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staticAgents.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-4">
                <h4 className="font-semibold">{agent.first_name} {agent.last_name}</h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {agent.phone || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {agent.email}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {/* Changed icon to MapPin */}
                  {agent.location || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
