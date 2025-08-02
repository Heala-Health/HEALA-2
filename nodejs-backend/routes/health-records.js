const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../lib/supabaseClient');

// Get all health records for a patient
router.get('/', auth(['patient', 'physician']), async (req, res) => {
    try {
        const { id, role } = req.user;
        let query = supabase.from('health_records').select('*');

        if (role === 'patient') {
            query = query.eq('patient_id', id);
        } else if (role === 'physician') {
            // This is a placeholder. You will need to implement the logic to get the health records for a physician's patients.
            // This might involve a join with an appointments table or a dedicated physician_patients table.
            res.json([]);
            return;
        }

        const { data, error } = await query.select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new health record
router.post('/', auth(['patient']), async (req, res) => {
    try {
        const { record_type, record_data } = req.body;
        const { id: patient_id } = req.user;

        const { data, error } = await supabase
            .from('health_records')
            .insert([{ patient_id, record_type, record_data }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
