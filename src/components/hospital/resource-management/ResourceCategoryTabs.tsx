
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Resource, ResourceCard } from './ResourceCard';

interface ResourceCategoryTabsProps {
  resources: Resource[];
  onUpdateResource: (resourceId: string, updates: Partial<Resource>) => void;
}

export const ResourceCategoryTabs: React.FC<ResourceCategoryTabsProps> = ({ resources, onUpdateResource }) => {
  const resourcesByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All Resources</TabsTrigger>
        <TabsTrigger value="beds">Beds</TabsTrigger>
        <TabsTrigger value="equipment">Equipment</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="grid gap-4">
          {resources.map((resource) => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              onUpdate={onUpdateResource}
            />
          ))}
        </div>
      </TabsContent>

      {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
        <TabsContent key={category} value={category}>
          <div className="grid gap-4">
            {categoryResources.map((resource) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                onUpdate={onUpdateResource}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
