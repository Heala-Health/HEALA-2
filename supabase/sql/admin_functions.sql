-- Create the log_admin_action function that's referenced in the admin components
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type_param TEXT,
    target_user_id_param TEXT DEFAULT NULL,
    target_resource_type_param TEXT DEFAULT NULL,
    target_resource_id_param TEXT DEFAULT NULL,
    action_details_param JSON DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    action_id TEXT;
BEGIN
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_user_id,
        target_resource_type,
        target_resource_id,
        action_details,
        created_at
    ) VALUES (
        auth.uid(),
        action_type_param,
        target_user_id_param,
        target_resource_type_param,
        target_resource_id_param,
        action_details_param,
        NOW()
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;