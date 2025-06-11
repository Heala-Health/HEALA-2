
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Settings, Moon, Sun } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setDarkMode(isDarkMode);
    
    // Check saved preferences
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    const savedNotifications = localStorage.getItem('notifications');
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (savedNotifications) {
      setNotifications(savedNotifications === 'true');
    }
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5" />
            Settings
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? 
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : 
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              }
              <Label htmlFor="dark-mode" className="text-gray-900 dark:text-white">Dark Mode</Label>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-white">Language</Label>
            <Select value={language || 'en'} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectItem value="en" className="text-gray-900 dark:text-white">English</SelectItem>
                <SelectItem value="es" className="text-gray-900 dark:text-white">Spanish</SelectItem>
                <SelectItem value="fr" className="text-gray-900 dark:text-white">French</SelectItem>
                <SelectItem value="de" className="text-gray-900 dark:text-white">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-gray-900 dark:text-white">Push Notifications</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {/* Save Button */}
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
