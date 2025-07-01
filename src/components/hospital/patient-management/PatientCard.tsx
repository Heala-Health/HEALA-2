
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, Edit, Save, X, Phone, Mail } from 'lucide-react';
import { Patient } from './types';

interface PatientCardProps {
  patient: Patient;
  onUpdateStatus: (patientId: string, newStatus: string, additionalData?: any) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onUpdateStatus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    room_number: patient.room_number || '',
    notes: patient.notes || ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'admitted':
        return 'bg-blue-100 text-blue-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSave = () => {
    onUpdateStatus(patient.id, patient.status, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      room_number: patient.room_number || '',
      notes: patient.notes || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-medium">{patient.patient_name}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {patient.patient_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {patient.patient_phone}
                </div>
              )}
              {patient.patient_email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {patient.patient_email}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(patient.status)}>
            {patient.status}
          </Badge>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Admission Date</p>
          <p className="text-sm">{new Date(patient.admission_date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Room Number</p>
          {isEditing ? (
            <Input
              value={editData.room_number}
              onChange={(e) => setEditData({...editData, room_number: e.target.value})}
              placeholder="Room number"
              className="h-8"
            />
          ) : (
            <p className="text-sm">{patient.room_number || 'Not assigned'}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Assigned Physician</p>
          <p className="text-sm">{patient.assigned_physician_name || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Discharge Date</p>
          <p className="text-sm">{patient.discharge_date ? new Date(patient.discharge_date).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      {(isEditing || patient.notes) && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Notes</p>
          {isEditing ? (
            <Textarea
              value={editData.notes}
              onChange={(e) => setEditData({...editData, notes: e.target.value})}
              placeholder="Patient notes..."
              rows={2}
            />
          ) : (
            <p className="text-sm">{patient.notes || 'No notes'}</p>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-2">
          {patient.status === 'active' && (
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(patient.id, 'admitted')}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Admit
            </Button>
          )}
          {(patient.status === 'active' || patient.status === 'admitted') && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onUpdateStatus(patient.id, 'discharged')}
            >
              Discharge
            </Button>
          )}
          {patient.status !== 'emergency' && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onUpdateStatus(patient.id, 'emergency')}
            >
              Mark Emergency
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
