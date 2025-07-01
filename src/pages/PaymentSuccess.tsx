
import React from 'react';
import { PaymentStatusHandler } from '@/components/enhanced-appointments/PaymentStatusHandler';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const PaymentSuccess = () => {
  return (
    <DashboardLayout title="Payment Status">
      <PaymentStatusHandler />
    </DashboardLayout>
  );
};

export default PaymentSuccess;
