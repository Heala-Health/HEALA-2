
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, Plus, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { usePatientManagement } from './patient-management/usePatientManagement';
import { PatientCard } from './patient-management/PatientCard';
import { PatientStats } from './patient-management/PatientStats';
import { AddPatientDialog } from './patient-management/AddPatientDialog';

export const PatientManagement: React.FC = () => {
  const { patients, loading, addPatient, updatePatientStatus } = usePatientManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || patient.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['all', 'active', 'discharged', 'admitted', 'emergency'];

  if (loading) {
    return <div className="p-6">Loading patients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Patient Management</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <PatientStats patients={patients} />

      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {statusOptions.map(status => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'No patients found matching your criteria' 
                  : 'No patients registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <PatientCard 
                  key={patient.id} 
                  patient={patient} 
                  onUpdateStatus={updatePatientStatus}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPatientDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddPatient={addPatient}
      />
    </div>
  );
};
