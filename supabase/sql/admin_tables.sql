-- Admin system database setup
-- This file creates the necessary tables and initial data for the admin system to function properly

-- Insert initial system settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, category, description, is_active) VALUES
('platform_maintenance_mode', '{"enabled": false, "message": "Platform is under maintenance. Please check back later."}', 'system', 'Controls platform-wide maintenance mode', true),
('user_registration_enabled', '{"enabled": true}', 'user_management', 'Controls whether new users can register', true),
('emergency_alert_enabled', '{"enabled": true, "alert_message": "Emergency services are available 24/7"}', 'emergency', 'Controls emergency alert system', true),
('auto_verification_rules', '{"physician": {"enabled": false}, "hospital": {"enabled": false}}', 'user_management', 'Automatic verification rules for different user types', true),
('payment_settings', '{"dispute_auto_resolve_days": 30, "max_refund_amount": 50000}', 'financial', 'Payment and dispute resolution settings', true),
('notification_settings', '{"email_enabled": true, "sms_enabled": false, "push_enabled": true}', 'notifications', 'Platform notification preferences', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_active ON system_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_by ON compliance_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_report_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON compliance_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_financial_disputes_status ON financial_disputes(status);
CREATE INDEX IF NOT EXISTS idx_financial_disputes_user_id ON financial_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_disputes_created_at ON financial_disputes(created_at);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_severity ON emergency_requests(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at ON emergency_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_submitted_at ON verification_requests(submitted_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Enable Row Level Security (RLS) for admin tables
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin actions are viewable by admins" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System settings are manageable by admins" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Compliance reports are manageable by admins" ON compliance_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    today DATE := CURRENT_DATE;
BEGIN
    -- Only allow admins to access this function
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'pending_verifications', (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'),
        'active_hospitals', (SELECT COUNT(*) FROM profiles WHERE role = 'hospital_admin' AND is_active = true),
        'active_physicians', (SELECT COUNT(*) FROM profiles WHERE role = 'physician' AND is_active = true),
        'emergency_alerts', (SELECT COUNT(*) FROM emergency_requests WHERE status = 'pending'),
        'pending_disputes', (SELECT COUNT(*) FROM financial_disputes WHERE status = 'pending'),
        'total_activities_today', (SELECT COUNT(*) FROM user_activity_logs WHERE created_at::date = today)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON compliance_reports TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(text, text, text, text, json) TO authenticated;