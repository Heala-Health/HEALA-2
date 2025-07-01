
import React from 'react';
import { VirtualConsultationRoom } from '@/components/consultation/VirtualConsultationRoom';
import { useSearchParams } from 'react-router-dom';

export const VirtualConsultationTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Virtual Consultation Room
      </h2>
      <VirtualConsultationRoom sessionId={searchParams.get('session')} />
    </div>
  );
};
