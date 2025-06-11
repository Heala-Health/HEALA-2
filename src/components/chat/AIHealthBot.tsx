
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  urgency?: 'low' | 'medium' | 'high';
}

export const AIHealthBot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI health assistant. Please describe your symptoms and I\'ll help assess them. Remember, this is not a substitute for professional medical advice.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeSymptoms = (symptoms: string): { response: string; urgency: 'low' | 'medium' | 'high' } => {
    const lowerSymptoms = symptoms.toLowerCase();
    
    // High urgency symptoms
    if (lowerSymptoms.includes('chest pain') || lowerSymptoms.includes('heart attack') || 
        lowerSymptoms.includes('can\'t breathe') || lowerSymptoms.includes('severe bleeding') ||
        lowerSymptoms.includes('unconscious') || lowerSymptoms.includes('seizure')) {
      return {
        response: '🚨 These symptoms require immediate medical attention. Please call emergency services (911) or go to the nearest emergency room immediately.',
        urgency: 'high'
      };
    }

    // Medium urgency symptoms
    if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('vomiting') || 
        lowerSymptoms.includes('severe pain') || lowerSymptoms.includes('difficulty breathing')) {
      return {
        response: '⚠️ Your symptoms suggest you should see a healthcare provider within 24 hours. Consider scheduling an urgent care visit or contacting your doctor.',
        urgency: 'medium'
      };
    }

    // Low urgency symptoms
    if (lowerSymptoms.includes('headache') || lowerSymptoms.includes('cold') || 
        lowerSymptoms.includes('cough') || lowerSymptoms.includes('sore throat')) {
      return {
        response: '💡 Your symptoms appear to be mild. Consider rest, hydration, and over-the-counter remedies. If symptoms persist or worsen, consult a healthcare provider.',
        urgency: 'low'
      };
    }

    return {
      response: 'I understand you\'re experiencing some symptoms. Can you provide more specific details? For example, where is the pain located, how long have you had these symptoms, and how severe are they on a scale of 1-10?',
      urgency: 'low'
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const { response, urgency } = analyzeSymptoms(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        urgency
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : `border ${getUrgencyColor(message.urgency)}`
              }`}>
                <div className="flex items-start gap-2">
                  {message.sender === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-blue-600" />}
                  {message.sender === 'user' && <User className="w-4 h-4 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    {message.urgency && (
                      <div className="flex items-center gap-1 mt-1">
                        {getUrgencyIcon(message.urgency)}
                        <Badge variant="secondary" className="text-xs">
                          {message.urgency} priority
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">AI is analyzing...</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your symptoms..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
