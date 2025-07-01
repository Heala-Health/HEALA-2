
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { Patient } from './types';

interface PatientStatsProps {
  patients: Patient[];
}

export const PatientStats: React.FC<PatientStatsProps> = ({ patients }) => {
  const activePatients = patients.filter(p => p.status === 'active').length;
  const admittedPatients = patients.filter(p => p.status === 'admitted').length;
  const emergencyPatients = patients.filter(p => p.status === 'emergency').length;
  const totalPatients = patients.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold">{totalPatients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold">{activePatients}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admitted</p>
              <p className="text-2xl font-bold">{admittedPatients}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emergency</p>
              <p className="text-2xl font-bold">{emergencyPatients}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
