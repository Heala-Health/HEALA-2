
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Medication } from './types/prescription';

interface MedicationFormProps {
  medication: Medication;
  index: number;
  onUpdate: (index: number, field: keyof Medication, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({
  medication,
  index,
  onUpdate,
  onRemove,
  canRemove
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Medication {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`medication_name_${index}`}>Medication Name *</Label>
          <Input
            id={`medication_name_${index}`}
            value={medication.medication_name || ''}
            onChange={(e) => onUpdate(index, 'medication_name', e.target.value)}
            placeholder="e.g., Paracetamol"
            required
          />
        </div>
        <div>
          <Label htmlFor={`dosage_${index}`}>Dosage *</Label>
          <Input
            id={`dosage_${index}`}
            value={medication.dosage}
            onChange={(e) => onUpdate(index, 'dosage', e.target.value)}
            placeholder="e.g., 500mg"
            required
          />
        </div>
        <div>
          <Label htmlFor={`frequency_${index}`}>Frequency *</Label>
          <Select
            value={medication.frequency || 'once_daily'}
            onValueChange={(value) => onUpdate(index, 'frequency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once_daily">Once daily</SelectItem>
              <SelectItem value="twice_daily">Twice daily</SelectItem>
              <SelectItem value="three_times_daily">Three times daily</SelectItem>
              <SelectItem value="four_times_daily">Four times daily</SelectItem>
              <SelectItem value="as_needed">As needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`duration_${index}`}>Duration *</Label>
          <Input
            id={`duration_${index}`}
            value={medication.duration}
            onChange={(e) => onUpdate(index, 'duration', e.target.value)}
            placeholder="e.g., 7 days"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`instructions_${index}`}>Special Instructions</Label>
        <Textarea
          id={`instructions_${index}`}
          value={medication.instructions || ''}
          onChange={(e) => onUpdate(index, 'instructions', e.target.value)}
          placeholder="e.g., Take with food"
          rows={2}
        />
      </div>
    </div>
  );
};
