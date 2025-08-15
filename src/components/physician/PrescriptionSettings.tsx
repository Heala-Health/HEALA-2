
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PrescriptionSettingsProps {
  repeatAllowed: boolean;
  maxRepeats: number;
  onRepeatAllowedChange: (allowed: boolean) => void;
  onMaxRepeatsChange: (maxRepeats: number) => void;
}

export const PrescriptionSettings: React.FC<PrescriptionSettingsProps> = ({
  repeatAllowed,
  maxRepeats,
  onRepeatAllowedChange,
  onMaxRepeatsChange
}) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Allow Prescription Repeats</Label>
          <p className="text-sm text-gray-500">Patient can request refills</p>
        </div>
        <Switch
          checked={repeatAllowed}
          onCheckedChange={onRepeatAllowedChange}
        />
      </div>

      {repeatAllowed && (
        <div>
          <Label htmlFor="max_repeats">Maximum Number of Repeats</Label>
          <Input
            id="max_repeats"
            type="number"
            min="1"
            max="12"
            value={maxRepeats}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onMaxRepeatsChange(0);
              } else {
                const parsed = parseInt(value, 10);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 12) {
                  onMaxRepeatsChange(parsed);
                }
              }
            }}
            placeholder="Enter number of repeats"
          />
        </div>
      )}
    </div>
  );
};
