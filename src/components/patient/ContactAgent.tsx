
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Phone, MapPin, User } from 'lucide-react';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  is_active: boolean;
}

export const ContactAgent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    urgency: 'normal'
  });

  useEffect(() => {
    fetchAvailableAgents();
  }, []);

  const fetchAvailableAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, city, state, is_active')
        .eq('role', 'agent')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;

      const formattedAgents = data?.map(agent => ({
        ...agent,
        first_name: agent.first_name || 'N/A',
        last_name: agent.last_name || 'N/A',
        phone: agent.phone || 'N/A',
        city: agent.city || 'N/A',
        state: agent.state || 'N/A'
      })) || [];

      setAgents(formattedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load available agents.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (agentId: string) => {
    if (!user) return;

    try {
      // Create a conversation with the agent
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          patient_id: user.id,
          type: 'agent_support',
          title: contactForm.subject || 'Patient Support Request',
          status: 'active'
        })
        .select()
        .single();

      if (convError) throw convError;

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'patient',
          content: contactForm.message,
          metadata: { urgency: contactForm.urgency }
        });

      if (messageError) throw messageError;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the agent. They will respond shortly.",
      });

      setContactForm({ subject: '', message: '', urgency: 'normal' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message to agent.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading available agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Contact an Agent</h2>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send a Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={contactForm.subject}
              onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="What do you need help with?"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={contactForm.message}
              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe your request or question..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <select
              id="urgency"
              value={contactForm.urgency}
              onChange={(e) => setContactForm(prev => ({ ...prev, urgency: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="low">Low - General inquiry</option>
              <option value="normal">Normal - Standard request</option>
              <option value="high">High - Urgent assistance needed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Available Agents */}
      <div className="grid gap-4">
        <h3 className="text-xl font-semibold">Available Agents</h3>
        {agents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No agents are currently available. Please try again later.</p>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <h4 className="font-semibold">{agent.first_name} {agent.last_name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{agent.city}, {agent.state}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleContactSubmit(agent.id)}
                    disabled={!contactForm.message.trim()}
                  >
                    Contact Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
