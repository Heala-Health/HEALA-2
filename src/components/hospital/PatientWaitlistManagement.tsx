
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { useWaitlist } from './waitlist/useWaitlist';
import { WaitlistStats } from './waitlist/WaitlistStats';
import { WaitlistCard } from './waitlist/WaitlistCard';
import { AddToWaitlistDialog } from './waitlist/AddToWaitlistDialog';

export const PatientWaitlistManagement: React.FC = () => {
  const { waitlist, loading, updateEntryStatus, fetchWaitlist } = useWaitlist();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const departments = [...new Set(waitlist.map(entry => entry.department))];
  const filteredWaitlist = selectedDepartment === 'all' 
    ? waitlist 
    : waitlist.filter(entry => entry.department === selectedDepartment);

  if (loading) {
    return <div className="p-6">Loading waitlist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Patient Waitlist</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add to Waitlist
        </Button>
      </div>

      <WaitlistStats waitlist={waitlist} />

      <div className="flex gap-2">
        <Button 
          variant={selectedDepartment === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedDepartment('all')}
        >
          All Departments
        </Button>
        {departments.map(dept => (
          <Button 
            key={dept}
            variant={selectedDepartment === dept ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDepartment(dept)}
          >
            {dept}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWaitlist.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients in the waitlist</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWaitlist.map((entry) => (
                <WaitlistCard 
                  key={entry.id} 
                  entry={entry} 
                  onUpdateStatus={updateEntryStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddToWaitlistDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddToWaitlist={fetchWaitlist}
      />
    </div>
  );
};
