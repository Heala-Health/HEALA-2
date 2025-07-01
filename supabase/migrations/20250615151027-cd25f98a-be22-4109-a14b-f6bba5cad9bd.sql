
-- Create patient waitlist table
CREATE TABLE public.patient_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  department TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  reason TEXT NOT NULL,
  estimated_wait_time INTEGER, -- in minutes
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create staff schedules table
CREATE TABLE public.staff_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  department TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create staff attendance table
CREATE TABLE public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for patient waitlist
ALTER TABLE public.patient_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital admins can manage their waitlist" 
ON public.patient_waitlist 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'hospital_admin' 
    AND hospital_id = patient_waitlist.hospital_id
  )
);

CREATE POLICY "Patients can view their waitlist status" 
ON public.patient_waitlist 
FOR SELECT 
TO authenticated 
USING (patient_id = auth.uid());

-- Add RLS policies for staff schedules
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital admins can manage their staff schedules" 
ON public.staff_schedules 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'hospital_admin' 
    AND hospital_id = staff_schedules.hospital_id
  )
);

CREATE POLICY "Staff can view their own schedules" 
ON public.staff_schedules 
FOR SELECT 
TO authenticated 
USING (staff_id = auth.uid());

-- Add RLS policies for staff attendance
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hospital admins can manage staff attendance" 
ON public.staff_attendance 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.staff_schedules s
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE s.id = staff_attendance.schedule_id
    AND p.role = 'hospital_admin'
    AND p.hospital_id = s.hospital_id
  )
);

CREATE POLICY "Staff can manage their own attendance" 
ON public.staff_attendance 
FOR ALL 
TO authenticated 
USING (staff_id = auth.uid());

-- Add foreign key constraints to profiles table instead of auth.users
ALTER TABLE public.patient_waitlist 
ADD CONSTRAINT fk_patient_waitlist_patient 
FOREIGN KEY (patient_id) REFERENCES public.profiles(id);

ALTER TABLE public.patient_waitlist 
ADD CONSTRAINT fk_patient_waitlist_hospital 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id);

ALTER TABLE public.staff_schedules 
ADD CONSTRAINT fk_staff_schedules_staff 
FOREIGN KEY (staff_id) REFERENCES public.profiles(id);

ALTER TABLE public.staff_schedules 
ADD CONSTRAINT fk_staff_schedules_hospital 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id);

ALTER TABLE public.staff_schedules 
ADD CONSTRAINT fk_staff_schedules_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.staff_attendance 
ADD CONSTRAINT fk_staff_attendance_schedule 
FOREIGN KEY (schedule_id) REFERENCES public.staff_schedules(id);

ALTER TABLE public.staff_attendance 
ADD CONSTRAINT fk_staff_attendance_staff 
FOREIGN KEY (staff_id) REFERENCES public.profiles(id);
