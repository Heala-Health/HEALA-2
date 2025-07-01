
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPatientPhysicianChat } from '@/components/enhanced-chat/EnhancedPatientPhysicianChat';

interface AgentConversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const PatientAgentChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', user?.id)
        .eq('type', 'agent_support')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching agent conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: user.id,
          type: 'agent_support',
          title: 'Agent Support Chat',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Send initial message
      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          content: 'Hello! I need assistance with my healthcare needs.',
          sender_type: 'patient',
          sender_id: user.id
        });

      setSelectedConversation(data.id);
      fetchConversations();

      toast({
        title: "Chat Started",
        description: "Your conversation with an agent has been created.",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start chat with agent.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (selectedConversation) {
    return (
      <EnhancedPatientPhysicianChat
        conversationId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat with Agent
        </CardTitle>
        <p className="text-sm text-gray-600">
          Get help with appointments, transport booking, or general healthcare support
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createNewConversation}
          disabled={creating}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {creating ? "Starting Chat..." : "Start New Chat with Agent"}
        </Button>

        {conversations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Previous Conversations</h3>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{conversation.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {conversation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {conversations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No previous conversations with agents.</p>
            <p className="text-sm">Start a new chat to get help!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
