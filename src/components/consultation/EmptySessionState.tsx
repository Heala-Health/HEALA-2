
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmptySessionState: React.FC = () => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/patient?tab=appointments');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Virtual Consultation Room
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-gray-600 mb-4">
            Start a virtual consultation by booking an appointment with a physician.
          </p>
          <Button onClick={handleBookAppointment}>
            Book Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
