
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AppointmentBookingLimitProps {
  onProceed: () => void;
  disabled?: boolean;
}

export const AppointmentBookingLimit: React.FC<AppointmentBookingLimitProps> = ({ 
  onProceed, 
  disabled = false 
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [monthlyBookings, setMonthlyBookings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkMonthlyBookings();
    }
  }, [user]);

  const checkMonthlyBookings = async () => {
    try {
      const { data, error } = await supabase
        .rpc('check_monthly_booking_limit', { patient_uuid: user?.id });

      if (error) throw error;
      setMonthlyBookings(data || 0);
    } catch (error) {
      console.error('Error checking monthly bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingLimit = () => {
    switch (profile?.subscription_plan) {
      case 'premium': return 10;
      case 'enterprise': return -1; // Unlimited
      default: return 3; // Basic plan
    }
  };

  const bookingLimit = getBookingLimit();
  const canBook = bookingLimit === -1 || monthlyBookings < bookingLimit;
  const remainingBookings = bookingLimit === -1 ? 'Unlimited' : bookingLimit - monthlyBookings;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Checking booking availability...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Monthly Booking Status</span>
        </CardTitle>
        <CardDescription>
          Track your appointment bookings for this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{monthlyBookings}</div>
            <div className="text-sm text-gray-600">Used This Month</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{remainingBookings}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>

        {!canBook && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You've reached your monthly booking limit of {bookingLimit} appointments. 
              Upgrade to Premium for more bookings or wait until next month.
            </AlertDescription>
          </Alert>
        )}

        {profile?.subscription_plan === 'basic' && canBook && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You're on the Basic plan ({monthlyBookings}/{bookingLimit} bookings used). 
              Upgrade to Premium for 10 bookings per month or Enterprise for unlimited bookings.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={onProceed} 
            disabled={disabled || !canBook}
            className="flex-1"
          >
            {canBook ? 'Book Appointment' : 'Limit Reached'}
          </Button>
          {!canBook && (
            <Button variant="outline" className="flex-1">
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
