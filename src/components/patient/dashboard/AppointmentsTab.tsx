
import React from 'react';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { EnhancedAppointmentBooking } from '@/components/enhanced-appointments/EnhancedAppointmentBooking';
import { PrescriptionNotifications } from '@/components/prescriptions/PrescriptionNotifications';

export const AppointmentsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <PrescriptionNotifications />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Book New Appointment</h3>
          <EnhancedAppointmentBooking />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">My Appointments</h3>
          <AppointmentList />
        </div>
      </div>
    </div>
  );
};
