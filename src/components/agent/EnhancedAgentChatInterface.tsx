
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPatientPhysicianChat } from '@/components/enhanced-chat/EnhancedPatientPhysicianChat';
import { 
  fetchAgentConversations, 
  AgentConversation 
} from './services/agentChatService';

export const EnhancedAgentChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await fetchAgentConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    loadConversations(); // Refresh conversations when going back
  };

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={handleBackToList}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Conversations
        </Button>
        <EnhancedPatientPhysicianChat
          conversationId={selectedConversation}
          onBack={handleBackToList}
        />
      </div>
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
          <Users className="w-5 h-5" />
          Patient Support Conversations
        </CardTitle>
        <p className="text-sm text-gray-600">
          Help patients with their healthcare needs and questions
        </p>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No patient conversations
            </h3>
            <p className="text-gray-500">
              Conversations will appear here when patients reach out for support.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Active Conversations ({conversations.length})</h3>
            </div>
            
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <User className="w-8 h-8 text-gray-400 mt-1" />
                    <div>
                      <h4 className="font-medium">
                        {conversation.patient ? 
                          `${conversation.patient.first_name} ${conversation.patient.last_name}` : 
                          'Unknown Patient'
                        }
                      </h4>
                      <p className="text-sm text-gray-600">
                        {conversation.patient?.email || 'No email available'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {conversation.title || 'Support Conversation'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      {conversation.status}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
