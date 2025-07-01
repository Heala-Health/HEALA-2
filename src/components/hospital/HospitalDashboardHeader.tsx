
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  is_active: boolean;
}

interface HospitalDashboardHeaderProps {
  hospitalInfo: HospitalInfo | null;
}

export const HospitalDashboardHeader: React.FC<HospitalDashboardHeaderProps> = ({
  hospitalInfo
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">{hospitalInfo?.name || 'Hospital Dashboard'}</h1>
          <p className="opacity-90">
            {hospitalInfo?.address}, {hospitalInfo?.city}, {hospitalInfo?.state}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant={hospitalInfo?.is_active ? "default" : "destructive"} className="bg-white/20">
              {hospitalInfo?.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="bg-white/20">
              {hospitalInfo?.verification_status}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Live Dashboard</span>
          </div>
          <Badge variant="outline" className="bg-white/20">
            <Zap className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </div>
    </div>
  );
};
