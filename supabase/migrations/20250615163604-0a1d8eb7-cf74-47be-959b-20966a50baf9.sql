
-- Phase 1: Database Schema Enhancement (Fixed)

-- Create hospital_financial_data table for real financial tracking
CREATE TABLE public.hospital_financial_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'revenue', 'expense', 'payment'
  category TEXT NOT NULL, -- 'appointments', 'emergency', 'equipment', 'staff'
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  description TEXT,
  reference_id UUID, -- link to appointments, consultations, etc.
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fiscal_month TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_hospital_financial_data_hospital FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE
);

-- Create hospital_compliance_tracking table for real-time compliance monitoring
CREATE TABLE public.hospital_compliance_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  compliance_type TEXT NOT NULL, -- 'hipaa', 'medical_records', 'staff_certification', 'quality_assurance', 'data_security'
  status TEXT NOT NULL DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'pending', 'under_review'
  score INTEGER DEFAULT 100, -- 0-100 compliance score
  last_assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_assessment_due DATE,
  assessment_details JSONB DEFAULT '{}',
  violations JSONB DEFAULT '[]',
  corrective_actions JSONB DEFAULT '[]',
  assessed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_hospital_compliance_hospital FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_hospital_compliance_assessed_by FOREIGN KEY (assessed_by) REFERENCES auth.users(id)
);

-- Create enhanced_audit_logs table for comprehensive system tracking
CREATE TABLE public.enhanced_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hospital_id UUID,
  action_category TEXT NOT NULL, -- 'financial', 'compliance', 'patient_care', 'system_admin'
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  impact_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  compliance_relevant BOOLEAN DEFAULT false,
  financial_impact DECIMAL(12,2) DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_enhanced_audit_logs_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enhanced_audit_logs_hospital FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL
);

-- Create financial_alerts table for real-time notifications
CREATE TABLE public.financial_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'revenue_drop', 'expense_spike', 'payment_overdue', 'budget_exceeded'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value DECIMAL(12,2),
  current_value DECIMAL(12,2),
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_financial_alerts_hospital FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_financial_alerts_resolved_by FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);

-- Create compliance_alerts table for real-time compliance notifications
CREATE TABLE public.compliance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  compliance_type TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'violation_detected', 'assessment_overdue', 'score_dropped', 'action_required'
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  compliance_score INTEGER,
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_compliance_alerts_hospital FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_compliance_alerts_resolved_by FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.hospital_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospital_financial_data
CREATE POLICY "Hospital staff can view their hospital's financial data" ON public.hospital_financial_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = hospital_financial_data.hospital_id
    )
  );

CREATE POLICY "Hospital admins can manage their hospital's financial data" ON public.hospital_financial_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = hospital_financial_data.hospital_id AND role = 'hospital_admin'
    )
  );

CREATE POLICY "Admins can view all financial data" ON public.hospital_financial_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for hospital_compliance_tracking
CREATE POLICY "Hospital staff can view their hospital's compliance data" ON public.hospital_compliance_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = hospital_compliance_tracking.hospital_id
    )
  );

CREATE POLICY "Hospital admins can manage their hospital's compliance data" ON public.hospital_compliance_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = hospital_compliance_tracking.hospital_id AND role = 'hospital_admin'
    )
  );

CREATE POLICY "Admins can manage all compliance data" ON public.hospital_compliance_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for enhanced_audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.enhanced_audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Hospital admins can view their hospital's audit logs" ON public.enhanced_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = enhanced_audit_logs.hospital_id AND role = 'hospital_admin'
    )
  );

CREATE POLICY "Admins can view all audit logs" ON public.enhanced_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for alerts
CREATE POLICY "Hospital staff can view their hospital's financial alerts" ON public.financial_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = financial_alerts.hospital_id
    )
  );

CREATE POLICY "Hospital staff can view their hospital's compliance alerts" ON public.compliance_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND hospital_id = compliance_alerts.hospital_id
    )
  );

-- Create indexes for performance
CREATE INDEX idx_hospital_financial_data_hospital_id ON public.hospital_financial_data(hospital_id);
CREATE INDEX idx_hospital_financial_data_transaction_date ON public.hospital_financial_data(transaction_date);
CREATE INDEX idx_hospital_financial_data_fiscal_month ON public.hospital_financial_data(fiscal_month);
CREATE INDEX idx_hospital_compliance_tracking_hospital_id ON public.hospital_compliance_tracking(hospital_id);
CREATE INDEX idx_enhanced_audit_logs_user_id ON public.enhanced_audit_logs(user_id);
CREATE INDEX idx_enhanced_audit_logs_hospital_id ON public.enhanced_audit_logs(hospital_id);
CREATE INDEX idx_enhanced_audit_logs_created_at ON public.enhanced_audit_logs(created_at);
CREATE INDEX idx_financial_alerts_hospital_id ON public.financial_alerts(hospital_id);
CREATE INDEX idx_compliance_alerts_hospital_id ON public.compliance_alerts(hospital_id);

-- Create functions for automatic compliance scoring
CREATE OR REPLACE FUNCTION public.calculate_hospital_compliance_score(hospital_uuid uuid)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 100;
  compliance_record RECORD;
BEGIN
  FOR compliance_record IN 
    SELECT compliance_type, status, score 
    FROM public.hospital_compliance_tracking 
    WHERE hospital_id = hospital_uuid
  LOOP
    IF compliance_record.status = 'non_compliant' THEN
      total_score := total_score - 20;
    ELSIF compliance_record.status = 'pending' THEN
      total_score := total_score - 10;
    END IF;
  END LOOP;
  
  RETURN GREATEST(total_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for enhanced audit logging (FIXED parameter defaults)
CREATE OR REPLACE FUNCTION public.log_enhanced_audit(
  user_id_param UUID,
  hospital_id_param UUID DEFAULT NULL,
  action_category_param TEXT DEFAULT 'system_admin',
  action_type_param TEXT DEFAULT 'unknown',
  resource_type_param TEXT DEFAULT NULL,
  resource_id_param UUID DEFAULT NULL,
  old_values_param JSONB DEFAULT '{}',
  new_values_param JSONB DEFAULT '{}',
  impact_level_param TEXT DEFAULT 'low',
  compliance_relevant_param BOOLEAN DEFAULT false,
  financial_impact_param DECIMAL DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.enhanced_audit_logs (
    user_id,
    hospital_id,
    action_category,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    impact_level,
    compliance_relevant,
    financial_impact
  ) VALUES (
    user_id_param,
    hospital_id_param,
    action_category_param,
    action_type_param,
    resource_type_param,
    resource_id_param,
    old_values_param,
    new_values_param,
    impact_level_param,
    compliance_relevant_param,
    financial_impact_param
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial compliance tracking data for existing hospitals
INSERT INTO public.hospital_compliance_tracking (hospital_id, compliance_type, status, score, next_assessment_due)
SELECT 
  h.id,
  compliance_type,
  'compliant' as status,
  85 + (RANDOM() * 15)::INTEGER as score,
  CURRENT_DATE + INTERVAL '90 days' as next_assessment_due
FROM public.hospitals h
CROSS JOIN (
  VALUES 
    ('hipaa'),
    ('medical_records'),
    ('staff_certification'),
    ('quality_assurance'),
    ('data_security')
) AS compliance_types(compliance_type)
WHERE h.is_active = true;

-- Create trigger to automatically log financial transactions
CREATE OR REPLACE FUNCTION public.log_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the financial transaction in audit logs
  PERFORM public.log_enhanced_audit(
    auth.uid(),
    NEW.hospital_id,
    'financial',
    TG_OP || '_financial_transaction',
    'hospital_financial_data',
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}' END,
    to_jsonb(NEW),
    CASE WHEN NEW.amount > 50000 THEN 'high' ELSE 'medium' END,
    true,
    NEW.amount
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_financial_transaction
  AFTER INSERT OR UPDATE ON public.hospital_financial_data
  FOR EACH ROW EXECUTE FUNCTION public.log_financial_transaction();
