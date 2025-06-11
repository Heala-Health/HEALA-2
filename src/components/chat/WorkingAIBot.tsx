
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const WorkingAIBot: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI health assistant. I can help with health questions, symptoms, and general medical advice. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Using a simple but effective health AI response system
      const healthKeywords = {
        fever: "For fever, rest and stay hydrated. Take paracetamol or ibuprofen as directed. See a doctor if fever persists over 3 days or exceeds 39°C (102°F).",
        headache: "For headaches, try rest in a quiet, dark room. Stay hydrated and consider over-the-counter pain relief. If severe or persistent, consult a healthcare provider.",
        cough: "For coughs, stay hydrated and try honey (if over 1 year old). See a doctor if cough persists over 2 weeks, has blood, or is accompanied by breathing difficulties.",
        pain: "For pain management, rest the affected area and consider appropriate pain relievers. Persistent or severe pain should be evaluated by a healthcare professional.",
        nausea: "For nausea, try small sips of clear fluids and bland foods like crackers. If persistent with vomiting or dehydration signs, seek medical attention.",
        emergency: "For medical emergencies, call emergency services immediately. Signs include: severe chest pain, difficulty breathing, severe bleeding, loss of consciousness, or severe allergic reactions.",
        appointment: "I can help you understand when to see a doctor. For routine check-ups, book through your healthcare provider. For urgent concerns, contact your doctor's office or urgent care.",
        medication: "Always take medications as prescribed. Don't stop or change dosages without consulting your doctor. Ask your pharmacist about side effects or interactions."
      };

      const message = userMessage.toLowerCase();
      
      // Check for specific health topics
      for (const [keyword, response] of Object.entries(healthKeywords)) {
        if (message.includes(keyword)) {
          return response;
        }
      }

      // General responses
      if (message.includes('hello') || message.includes('hi')) {
        return "Hello! I'm here to help with your health questions. You can ask me about symptoms, when to see a doctor, or general health advice. What would you like to know?";
      }
      
      if (message.includes('thank')) {
        return "You're welcome! Remember, I provide general health information only. For serious concerns or diagnosis, please consult with a qualified healthcare professional.";
      }

      if (message.includes('doctor') || message.includes('physician')) {
        return "I recommend consulting with a healthcare professional for personalized medical advice. Would you like help understanding what type of specialist might be appropriate for your concern?";
      }

      // Default response
      return "I understand you have a health concern. While I can provide general information, it's important to consult with a healthcare professional for proper diagnosis and treatment. Can you tell me more about your specific symptoms or concerns?";
      
    } catch (error) {
      console.error('AI Response Error:', error);
      return "I'm having trouble processing your request right now. For immediate health concerns, please contact a healthcare provider directly.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await getAIResponse(input.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Health Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your health..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
