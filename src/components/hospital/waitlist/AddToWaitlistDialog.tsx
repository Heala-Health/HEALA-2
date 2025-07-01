
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddToWaitlistDialogProps {
  open: boolean;
  onClose: () => void;
  onAddToWaitlist: () => void;
}

export const AddToWaitlistDialog: React.FC<AddToWaitlistDialogProps> = ({
  open,
  onClose,
  onAddToWaitlist
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    department: '',
    priority: 'medium',
    reason: '',
    estimated_wait_time: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.hospital_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('patient_waitlist')
        .insert({
          ...formData,
          hospital_id: profile.hospital_id,
          estimated_wait_time: Number(formData.estimated_wait_time)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient added to waitlist successfully.",
      });

      onAddToWaitlist();
      onClose();
      setFormData({
        patient_id: '',
        department: '',
        priority: 'medium',
        reason: '',
        estimated_wait_time: 30
      });
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: "Error",
        description: "Failed to add patient to waitlist.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Patient to Waitlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient_id">Patient ID</Label>
            <Input
              id="patient_id"
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              placeholder="Enter patient ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="radiology">Radiology</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimated_wait_time">Estimated Wait Time (minutes)</Label>
            <Input
              id="estimated_wait_time"
              type="number"
              value={formData.estimated_wait_time}
              onChange={(e) => setFormData({ ...formData, estimated_wait_time: Number(e.target.value) })}
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for visit"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add to Waitlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
