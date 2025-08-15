
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Bot, Pill } from 'lucide-react';

interface ChatTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TAB_CONFIG = [
  { value: 'patients', icon: User, label: 'Patient Chat' },
  { value: 'prescriptions', icon: Pill, label: 'Prescriptions' },
  { value: 'physicians', icon: Users, label: 'Physician Chat' },
  { value: 'ai', icon: Bot, label: 'AI Assistant' }
];

export const ChatTabs: React.FC<ChatTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <TabsList className="grid w-full grid-cols-4">
      {TAB_CONFIG.map(({ value, icon: Icon, label }) => (
        <TabsTrigger key={value} value={value} className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
