
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, User } from 'lucide-react';

interface ConsultationTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  userPlan: string;
  inPersonCount: number;
  extraCost: number;
}

export const ConsultationTypeSelector: React.FC<ConsultationTypeSelectorProps> = ({
  value,
  onChange,
  userPlan,
  inPersonCount,
  extraCost
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="consultation_type">Consultation Type *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select consultation type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="virtual">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>Virtual Consultation</span>
              <Badge variant="secondary" className="text-xs">Free</Badge>
            </div>
          </SelectItem>
          <SelectItem value="in_person">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>In-Person Consultation</span>
              {userPlan === 'basic' && inPersonCount >= 2 && (
                <Badge variant="destructive" className="text-xs">₦{extraCost}</Badge>
              )}
              {userPlan === 'basic' && inPersonCount < 2 && (
                <Badge variant="secondary" className="text-xs">Free ({2 - inPersonCount} left)</Badge>
              )}
              {userPlan !== 'basic' && (
                <Badge variant="secondary" className="text-xs">Unlimited</Badge>
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {value === 'in_person' && userPlan === 'basic' && inPersonCount >= 2 && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          You've reached your monthly limit. Additional in-person consultations cost ₦{extraCost} each.
        </div>
      )}
    </div>
  );
};
