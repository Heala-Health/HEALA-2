
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            </div>
            <DashboardHeader title="" />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6 bg-gray-50 dark:bg-gray-900">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
