
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Activity, Clock, AlertTriangle } from 'lucide-react';
import { Resource } from './ResourceCard';

interface ResourceStatsProps {
  resources: Resource[];
}

export const ResourceStats: React.FC<ResourceStatsProps> = ({ resources }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Resources</p>
              <p className="text-2xl font-bold">{resources.reduce((acc, r) => acc + r.total, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {resources.reduce((acc, r) => acc + r.available, 0)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Use</p>
              <p className="text-2xl font-bold text-blue-600">
                {resources.reduce((acc, r) => acc + r.inUse, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">
                {resources.reduce((acc, r) => acc + r.maintenance, 0)}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
