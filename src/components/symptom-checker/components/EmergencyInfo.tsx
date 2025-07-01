
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export const EmergencyInfo: React.FC = () => {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Phone className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Emergency Contact Information</h4>
            <p className="text-sm text-blue-800 mb-3">
              If this is a medical emergency, don't wait - call for help immediately.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p><strong>National Emergency:</strong> 199 or 112</p>
                <p><strong>Lagos State Emergency:</strong> 199 or 767</p>
              </div>
              <div>
                <p><strong>Abuja Emergency:</strong> 112</p>
                <p><strong>Medical Emergency:</strong> Contact nearest hospital</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
