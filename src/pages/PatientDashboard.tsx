
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PatientDashboardContent } from '@/components/patient/dashboard/PatientDashboardContent';
import { PatientDashboardTab } from '@/components/patient/dashboard/types';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PatientDashboardTab>('appointments');

  useEffect(() => {
    const tab = searchParams.get('tab') as PatientDashboardTab;
    console.log('Current tab from URL:', tab);
    
    // If no tab is specified, redirect to appointments tab
    if (!tab) {
      console.log('No tab specified, redirecting to appointments');
      navigate('/patient?tab=appointments', { replace: true });
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, navigate]);

  console.log('Rendering PatientDashboard with activeTab:', activeTab);

  return (
    <DashboardLayout title="Patient Dashboard">
      <PatientDashboardContent activeTab={activeTab} />
    </DashboardLayout>
  );
};

export default PatientDashboard;
