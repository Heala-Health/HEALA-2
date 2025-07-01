
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useResourceData } from './resource-management/useResourceData';
import { CriticalAlerts } from './resource-management/CriticalAlerts';
import { ResourceStats } from './resource-management/ResourceStats';
import { ResourceCategoryTabs } from './resource-management/ResourceCategoryTabs';
import { AddResourceDialog } from './resource-management/AddResourceDialog';

export const HospitalResourceManagement: React.FC = () => {
  const { resources, loading, addResource, updateResource } = useResourceData();
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (loading) {
    return <div className="p-6">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Critical Alerts */}
      <CriticalAlerts resources={resources} />

      {/* Overview Stats */}
      <ResourceStats resources={resources} />

      {/* Resource Categories */}
      <ResourceCategoryTabs resources={resources} onUpdateResource={updateResource} />

      <AddResourceDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddResource={addResource}
      />
    </div>
  );
};
