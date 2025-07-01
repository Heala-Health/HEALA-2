
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Bot, Pill } from 'lucide-react';

interface ChatTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({ activeTab, onTabChange }) => {
  return (
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
  );
};
