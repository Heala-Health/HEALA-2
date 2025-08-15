
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { VerificationCenter } from '@/components/admin/VerificationCenter';
import { RealTimeMonitoring } from '@/components/admin/RealTimeMonitoring';
import { UserActivityMonitor } from '@/components/admin/UserActivityMonitor';
import { EmergencyManagement } from '@/components/admin/EmergencyManagement';
import { FinancialDisputes } from '@/components/admin/FinancialDisputes';
import { ComplianceReports } from '@/components/admin/ComplianceReports';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'verifications':
        return <VerificationCenter />;
      case 'monitoring':
        return <RealTimeMonitoring />;
      case 'activity':
        return <UserActivityMonitor />;
      case 'emergency':
        return <EmergencyManagement />;
      case 'financial':
        return <FinancialDisputes />;
      case 'compliance':
        return <ComplianceReports />;
      case 'settings':
        return <AdminSystemSettings />;
      case 'audit':
        return <AdminAuditLog />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
