
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Resource } from './ResourceCard';

interface AddResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onAddResource: (data: Omit<Resource, 'id'>) => void;
}

export const AddResourceDialog: React.FC<AddResourceDialogProps> = ({ 
  open, 
  onClose, 
  onAddResource 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'equipment',
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    status: 'available' as 'available' | 'limited' | 'critical'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    onAddResource(formData);
    setFormData({
      name: '',
      category: 'equipment',
      total: 0,
      available: 0,
      inUse: 0,
      maintenance: 0,
      status: 'available'
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Resource Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., X-Ray Machine, ICU Bed"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beds">Beds</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="rooms">Rooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total">Total Quantity</Label>
              <Input
                id="total"
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="available">Available</Label>
              <Input
                id="available"
                type="number"
                value={formData.available}
                onChange={(e) => setFormData({...formData, available: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inUse">In Use</Label>
              <Input
                id="inUse"
                type="number"
                value={formData.inUse}
                onChange={(e) => setFormData({...formData, inUse: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="maintenance">Maintenance</Label>
              <Input
                id="maintenance"
                type="number"
                value={formData.maintenance}
                onChange={(e) => setFormData({...formData, maintenance: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'available' | 'limited' | 'critical') => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Resource</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
