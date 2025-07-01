
-- Create hospital_patients table
CREATE TABLE public.hospital_patients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'admitted', 'emergency')),
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  discharge_date date,
  room_number text,
  assigned_physician_id uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, hospital_id)
);

-- Create hospital_resources table
CREATE TABLE public.hospital_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('beds', 'equipment', 'vehicles', 'rooms')),
  total_quantity integer NOT NULL DEFAULT 0,
  available_quantity integer NOT NULL DEFAULT 0,
  in_use_quantity integer NOT NULL DEFAULT 0,
  maintenance_quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'limited', 'critical')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security for hospital_patients
ALTER TABLE public.hospital_patients ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital_patients - hospital admins can manage their hospital's patients
CREATE POLICY "Hospital admins can manage their patients" 
  ON public.hospital_patients 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'hospital_admin' 
      AND hospital_id = hospital_patients.hospital_id
    )
  );

-- Add Row Level Security for hospital_resources
ALTER TABLE public.hospital_resources ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital_resources - hospital admins can manage their hospital's resources
CREATE POLICY "Hospital admins can manage their resources" 
  ON public.hospital_resources 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'hospital_admin' 
      AND hospital_id = hospital_resources.hospital_id
    )
  );

-- Enable realtime for both tables
ALTER TABLE public.hospital_patients REPLICA IDENTITY FULL;
ALTER TABLE public.hospital_resources REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_resources;
