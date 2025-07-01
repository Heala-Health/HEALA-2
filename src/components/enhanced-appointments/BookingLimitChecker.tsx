
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BookingLimit {
  current_count: number;
  limit_allowed: number;
  subscription_plan: string;
  can_book_free: boolean;
  extra_cost: number;
}

interface BookingLimitCheckerProps {
  onLimitCheck: (limit: BookingLimit) => void;
}

export const BookingLimitChecker: React.FC<BookingLimitCheckerProps> = ({ onLimitCheck }) => {
  const { user } = useAuth();

  useEffect(() => {
    const checkBookingLimit = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .rpc('check_inperson_booking_limit', { patient_uuid: user.id });

        if (error) throw error;

        if (data && data.length > 0) {
          onLimitCheck(data[0]);
        }
      } catch (error) {
        console.error('Error checking booking limit:', error);
      }
    };

    checkBookingLimit();
  }, [user, onLimitCheck]);

  return null;
};
