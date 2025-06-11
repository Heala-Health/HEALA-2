
import React, { useState, useEffect } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { AdminVerificationCenter } from '@/components/admin/AdminVerificationCenter';
import { DocumentManagement } from '@/components/admin/DocumentManagement';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'users';
    setActiveTab(tab);
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <SystemAnalytics />;
      case 'verification':
        return <AdminVerificationCenter />;
      case 'documents':
        return <DocumentManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
