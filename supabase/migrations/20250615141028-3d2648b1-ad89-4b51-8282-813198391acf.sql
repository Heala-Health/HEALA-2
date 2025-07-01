
-- Create admin_actions table for audit logging
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_resource_type TEXT,
  target_resource_id UUID,
  action_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create system_settings table for platform configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activity_logs table for tracking user behavior
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_activity_logs_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create compliance_reports table for regulatory requirements
CREATE TABLE public.compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_by UUID NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  status TEXT DEFAULT 'generated',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_compliance_reports_generated_by FOREIGN KEY (generated_by) REFERENCES auth.users(id)
);

-- Create financial_disputes table for payment issue management
CREATE TABLE public.financial_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id UUID,
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_financial_disputes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_financial_disputes_resolved_by FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);

-- Create system_alerts table for critical notifications
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  target_audience TEXT DEFAULT 'all', -- 'all', 'admins', 'physicians', 'patients', etc.
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_system_alerts_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_actions (only admins can access)
CREATE POLICY "Admins can manage admin actions" ON public.admin_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for system_settings (only admins can modify)
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for user_activity_logs (admins can view all, users can view their own)
CREATE POLICY "Admins can view all activity logs" ON public.user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for compliance_reports (only admins)
CREATE POLICY "Admins can manage compliance reports" ON public.compliance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for financial_disputes (admins can manage all, users can view their own)
CREATE POLICY "Admins can manage all financial disputes" ON public.financial_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own financial disputes" ON public.financial_disputes
  FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for system_alerts (admins can manage, all can view active alerts)
CREATE POLICY "Admins can manage system alerts" ON public.system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view active system alerts" ON public.system_alerts
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create database function for logging admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type_param TEXT,
  target_user_id_param UUID DEFAULT NULL,
  target_resource_type_param TEXT DEFAULT NULL,
  target_resource_id_param UUID DEFAULT NULL,
  action_details_param JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (
    admin_id,
    action_type,
    target_user_id,
    target_resource_type,
    target_resource_id,
    action_details
  ) VALUES (
    auth.uid(),
    action_type_param,
    target_user_id_param,
    target_resource_type_param,
    target_resource_id_param,
    action_details_param
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create database function for logging user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  user_id_param UUID,
  activity_type_param TEXT,
  activity_details_param JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id,
    activity_type,
    activity_details
  ) VALUES (
    user_id_param,
    activity_type_param,
    activity_details_param
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description, category) VALUES
('platform_maintenance_mode', '{"enabled": false, "message": "System maintenance in progress"}', 'Platform maintenance mode settings', 'system'),
('user_registration_enabled', '{"enabled": true}', 'User registration configuration', 'user_management'),
('emergency_alert_enabled', '{"enabled": true, "alert_message": ""}', 'Emergency alert system settings', 'emergency'),
('auto_verification_rules', '{"physician": {"enabled": false, "criteria": []}, "hospital": {"enabled": false, "criteria": []}}', 'Auto-approval rules for verification requests', 'verification'),
('payment_settings', '{"dispute_auto_resolve_days": 30, "max_refund_amount": 50000}', 'Payment and financial settings', 'financial'),
('notification_settings', '{"email_enabled": true, "sms_enabled": false, "push_enabled": true}', 'System notification preferences', 'notifications');

-- Create indexes for better performance
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);
CREATE INDEX idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
CREATE INDEX idx_system_settings_setting_key ON public.system_settings(setting_key);
CREATE INDEX idx_financial_disputes_user_id ON public.financial_disputes(user_id);
CREATE INDEX idx_financial_disputes_status ON public.financial_disputes(status);
CREATE INDEX idx_system_alerts_is_active ON public.system_alerts(is_active);
