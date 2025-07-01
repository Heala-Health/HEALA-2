
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Resource } from './ResourceCard';

interface CriticalAlertsProps {
  resources: Resource[];
}

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({ resources }) => {
  const criticalResources = resources.filter(r => r.status === 'critical');
  const limitedResources = resources.filter(r => r.status === 'limited');

  if (criticalResources.length === 0 && limitedResources.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {criticalResources.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Critical Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalResources.map((resource) => (
                <div key={resource.id} className="flex justify-between items-center">
                  <span className="font-medium">{resource.name}</span>
                  <span className="text-sm text-red-600">
                    {resource.available} available
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {limitedResources.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              Limited Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {limitedResources.map((resource) => (
                <div key={resource.id} className="flex justify-between items-center">
                  <span className="font-medium">{resource.name}</span>
                  <span className="text-sm text-yellow-600">
                    {resource.available} available
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
