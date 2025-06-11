
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, User, Users, Bot, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkingAIBot } from '@/components/chat/WorkingAIBot';
import { PatientPhysicianChat } from '@/components/chat/PatientPhysicianChat';
import { ConversationList } from '@/components/chat/ConversationList';
import { PatientList } from './PatientList';
import { PrescriptionInput } from './PrescriptionInput';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string;
  title: string;
  status: string;
  created_at: string;
  patient_name: string;
}

export const PhysicianChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');

  useEffect(() => {
    fetchPatients();
    fetchConversations();
  }, []);

  const fetchPatients = async () => {
    try {
      // Get patients assigned to this physician
      const { data: assignedPatients, error: assignmentError } = await supabase
        .from('physician_patients')
        .select('patient_id')
        .eq('physician_id', user?.id)
        .eq('status', 'active');

      if (assignmentError) throw assignmentError;

      if (!assignedPatients || assignedPatients.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      const patientIds = assignedPatients.map(p => p.patient_id);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', patientIds)
        .eq('role', 'patient');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('physician_id', user?.id)
        .eq('type', 'physician_consultation')
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      const conversationsWithPatients = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', conv.patient_id)
            .single();

          return {
            id: conv.id,
            patient_id: conv.patient_id,
            physician_id: conv.physician_id,
            title: conv.title,
            status: conv.status,
            created_at: conv.created_at,
            patient_name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Unknown Patient'
          };
        })
      );

      setConversations(conversationsWithPatients);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startNewConversation = async (patientId: string, patientName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          physician_id: user.id,
          type: 'physician_consultation',
          title: `Consultation with Dr. ${user.user_metadata?.first_name || 'Physician'}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'physician',
          sender_id: user.id,
          content: `Hello ${patientName}! I'm ready to help you with your health concerns. How can I assist you today?`
        });

      setSelectedConversation(data.id);
      fetchConversations();
      
      toast({
        title: "Conversation Started",
        description: `New consultation started with ${patientName}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Physician Communication Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Chat
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger value="physicians" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Physician Chat
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <ConversationList 
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                  />
                  <PatientList 
                    patients={patients}
                    onStartConversation={startNewConversation}
                  />
                </div>

                <div className="lg:col-span-2">
                  <PatientPhysicianChat 
                    conversationId={selectedConversation || undefined} 
                    onBack={() => setSelectedConversation(null)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <PatientList 
                    patients={patients}
                    onStartConversation={(patientId, patientName) => {
                      const patient = patients.find(p => p.id === patientId);
                      setSelectedPatient(patient || null);
                    }}
                    actionLabel="Select for Prescription"
                  />
                </div>

                <div className="lg:col-span-2">
                  {selectedPatient ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium text-blue-900">
                          Creating prescription for: {selectedPatient.first_name} {selectedPatient.last_name}
                        </h3>
                        <p className="text-sm text-blue-700">{selectedPatient.email}</p>
                      </div>
                      <PrescriptionInput 
                        patientId={selectedPatient.id}
                        onPrescriptionAdded={() => {
                          toast({
                            title: "Prescription Created",
                            description: `Prescription created for ${selectedPatient.first_name} ${selectedPatient.last_name}`
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      <div className="text-center">
                        <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>Select a patient to create a prescription</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physicians" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                Physician-to-physician chat coming soon
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <WorkingAIBot />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
