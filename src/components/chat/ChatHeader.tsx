
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface ChatHeaderProps {
  physician?: Physician | null;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ physician, onBack }) => {
  return (
    <CardHeader className="flex-shrink-0 border-b">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            {physician ? `${physician.first_name[0]}${physician.last_name[0]}` : 'DR'}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">
            {physician ? `Dr. ${physician.first_name} ${physician.last_name}` : 'Physician'}
          </CardTitle>
          {physician?.specialization && (
            <Badge variant="outline" className="text-xs">
              {physician.specialization}
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
  );
};
