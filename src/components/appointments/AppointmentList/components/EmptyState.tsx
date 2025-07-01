
import React from 'react';
import { Calendar } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-300">No appointments scheduled</p>
    </div>
  );
};
