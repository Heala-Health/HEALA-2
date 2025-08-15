-- Physician system database functions
-- This file creates the necessary functions for the physician system to work properly

-- Create the missing create_virtual_consultation_session function
CREATE OR REPLACE FUNCTION create_virtual_consultation_session(
    appointment_uuid UUID,
    patient_uuid UUID,
    physician_uuid UUID,
    consultation_rate_param NUMERIC DEFAULT 5000
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    room_token TEXT;
BEGIN
    -- Generate session ID
    session_id := gen_random_uuid();
    room_token := 'room_' || session_id;
    
    -- Create consultation session
    INSERT INTO consultation_sessions (
        id,
        appointment_id,
        patient_id,
        physician_id,
        consultation_rate,
        session_type,
        status,
        payment_status,
        created_at
    ) VALUES (
        session_id,
        appointment_uuid,
        patient_uuid,
        physician_uuid,
        consultation_rate_param,
        'video',
        'scheduled',
        'pending',
        NOW()
    );
    
    -- Create consultation room
    INSERT INTO consultation_rooms (
        session_id,
        room_token,
        room_status,
        patient_joined,
        physician_joined,
        created_at
    ) VALUES (
        session_id,
        room_token,
        'waiting',
        false,
        false,
        NOW()
    );
    
    -- Log the session creation
    INSERT INTO user_activity_logs (
        user_id,
        activity_type,
        activity_details
    ) VALUES (
        physician_uuid,
        'virtual_session_created',
        json_build_object(
            'session_id', session_id,
            'patient_id', patient_uuid,
            'appointment_id', appointment_uuid
        )
    );
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get physician patients
CREATE OR REPLACE FUNCTION get_physician_patients(physician_uuid UUID)
RETURNS TABLE (
    patient_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    total_appointments BIGINT,
    last_appointment_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        COALESCE(apt_count.total, 0) as total_appointments,
        apt_count.last_date as last_appointment_date
    FROM profiles p
    INNER JOIN physician_patients pp ON p.id = pp.patient_id
    LEFT JOIN (
        SELECT 
            patient_id,
            COUNT(*) as total,
            MAX(appointment_date) as last_date
        FROM appointments 
        WHERE physician_id = physician_uuid
        GROUP BY patient_id
    ) apt_count ON p.id = apt_count.patient_id
    WHERE pp.physician_id = physician_uuid 
    AND pp.status = 'active'
    ORDER BY apt_count.last_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get physician dashboard stats
CREATE OR REPLACE FUNCTION get_physician_dashboard_stats(physician_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    today DATE := CURRENT_DATE;
BEGIN
    SELECT json_build_object(
        'today_appointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE physician_id = physician_uuid 
            AND appointment_date = today
        ),
        'total_patients', (
            SELECT COUNT(*) FROM physician_patients 
            WHERE physician_id = physician_uuid 
            AND status = 'active'
        ),
        'pending_reviews', (
            SELECT COUNT(*) FROM appointments 
            WHERE physician_id = physician_uuid 
            AND status = 'pending'
        ),
        'completed_consultations', (
            SELECT COUNT(*) FROM consultation_sessions 
            WHERE physician_id = physician_uuid 
            AND status = 'completed'
        ),
        'total_earnings', (
            SELECT COALESCE(SUM(consultation_rate), 0) 
            FROM consultation_sessions 
            WHERE physician_id = physician_uuid 
            AND payment_status = 'completed'
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to start consultation session securely
CREATE OR REPLACE FUNCTION start_consultation_session_secure(
    session_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record consultation_sessions%ROWTYPE;
BEGIN
    -- Get session details
    SELECT * INTO session_record 
    FROM consultation_sessions 
    WHERE id = session_uuid;
    
    -- Check if user is authorized (patient or physician)
    IF session_record.patient_id != user_uuid AND session_record.physician_id != user_uuid THEN
        RAISE EXCEPTION 'Unauthorized access to consultation session';
    END IF;
    
    -- Update session status
    UPDATE consultation_sessions 
    SET 
        status = 'in_progress',
        started_at = NOW()
    WHERE id = session_uuid;
    
    -- Update room status
    UPDATE consultation_rooms 
    SET room_status = 'active'
    WHERE session_id = session_uuid;
    
    -- Update participant joined status
    IF session_record.patient_id = user_uuid THEN
        UPDATE consultation_rooms 
        SET patient_joined = true
        WHERE session_id = session_uuid;
    ELSE
        UPDATE consultation_rooms 
        SET physician_joined = true
        WHERE session_id = session_uuid;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to end consultation session securely
CREATE OR REPLACE FUNCTION end_consultation_session_secure(
    session_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record consultation_sessions%ROWTYPE;
    duration_mins INTEGER;
BEGIN
    -- Get session details
    SELECT * INTO session_record 
    FROM consultation_sessions 
    WHERE id = session_uuid;
    
    -- Check if user is authorized (patient or physician)
    IF session_record.patient_id != user_uuid AND session_record.physician_id != user_uuid THEN
        RAISE EXCEPTION 'Unauthorized access to consultation session';
    END IF;
    
    -- Calculate duration
    duration_mins := EXTRACT(EPOCH FROM (NOW() - session_record.started_at)) / 60;
    
    -- Update session status
    UPDATE consultation_sessions 
    SET 
        status = 'completed',
        ended_at = NOW(),
        duration_minutes = duration_mins
    WHERE id = session_uuid;
    
    -- Update room status
    UPDATE consultation_rooms 
    SET room_status = 'ended'
    WHERE session_id = session_uuid;
    
    -- Process payment if not already done
    IF session_record.payment_status = 'pending' THEN
        PERFORM process_consultation_payment(
            session_uuid,
            session_record.patient_id,
            session_record.physician_id,
            session_record.consultation_rate
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_virtual_consultation_session(UUID, UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_physician_patients(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_physician_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_consultation_session_secure(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION end_consultation_session_secure(UUID, UUID) TO authenticated;