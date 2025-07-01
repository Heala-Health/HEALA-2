
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StaffSchedule, StaffAttendance } from './types';
import { fetchStaffProfilesByIds } from './utils';

export const useStaffSchedule = (selectedDate: string) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .gte('start_date', selectedDate)
        .lte('end_date', selectedDate)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const staffIds = [...new Set((data || []).map(sch => sch.staff_id))];
      const profilesMap = await fetchStaffProfilesByIds(staffIds);

      const formattedData: StaffSchedule[] = (data || []).map(schedule => {
        const p = profilesMap[schedule.staff_id] || { first_name: '', last_name: '', role: 'staff' };
        return {
          id: schedule.id,
          staff_id: schedule.staff_id,
          department: schedule.department,
          shift_type: schedule.shift_type,
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          status: schedule.status as 'scheduled' | 'confirmed' | 'cancelled',
          staff_name: (p.first_name || p.last_name) ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown Staff',
          staff_role: p.role || 'staff'
        };
      });

      setSchedules(formattedData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load schedules.",
        variant: "destructive"
      });
    }
  };

  const fetchAttendance = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('created_at', selectedDate);

      if (error) throw error;

      const staffIds = [...new Set((data || []).map(a => a.staff_id))];
      const profilesMap = await fetchStaffProfilesByIds(staffIds);

      const formattedData: StaffAttendance[] = (data || []).map(attendance => {
        const p = profilesMap[attendance.staff_id] || { first_name: '', last_name: '', role: 'staff' };
        return {
          id: attendance.id,
          schedule_id: attendance.schedule_id,
          staff_id: attendance.staff_id,
          check_in_time: attendance.check_in_time,
          check_out_time: attendance.check_out_time,
          status: attendance.status as 'scheduled' | 'checked_in' | 'checked_out' | 'absent',
          staff_name: (p.first_name || p.last_name) ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown Staff'
        };
      });

      setAttendance(formattedData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (scheduleId: string, staffId: string, action: 'check_in' | 'check_out') => {
    try {
      const now = new Date().toISOString();
      const updateData = action === 'check_in' 
        ? { check_in_time: now, status: 'checked_in' }
        : { check_out_time: now, status: 'checked_out' };

      const { data: existingAttendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('staff_id', staffId)
        .single();

      if (existingAttendance) {
        const { error } = await supabase
          .from('staff_attendance')
          .update(updateData)
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff_attendance')
          .insert({
            schedule_id: scheduleId,
            staff_id: staffId,
            ...updateData
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Staff ${action === 'check_in' ? 'checked in' : 'checked out'} successfully.`,
      });

      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchSchedules();
      fetchAttendance();
    }
  }, [user, profile, selectedDate]);

  return {
    schedules,
    attendance,
    loading,
    markAttendance,
    fetchSchedules,
    fetchAttendance
  };
};
