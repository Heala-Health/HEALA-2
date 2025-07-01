
export interface StaffSchedule {
  id: string;
  staff_id: string;
  department: string;
  shift_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  staff_name?: string;
  staff_role?: string;
}

export interface StaffAttendance {
  id: string;
  schedule_id: string;
  staff_id: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'absent';
  staff_name?: string;
}
