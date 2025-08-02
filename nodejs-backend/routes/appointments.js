const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../lib/supabaseClient');

// Get all appointments for a user (patient or physician)
router.get('/', auth(['patient', 'physician']), async (req, res) => {
    try {
        const { id, role } = req.user;
        let query = supabase.from('appointments').select('*');

        if (role === 'patient') {
            query = query.eq('patient_id', id);
        } else if (role === 'physician') {
            query = query.eq('physician_id', id);
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

// Create a new appointment
router.post('/', auth(['patient']), async (req, res) => {
    try {
        const { physician_id, appointment_date, notes } = req.body;
        const { id: patient_id } = req.user;

        const { data, error } = await supabase
            .from('appointments')
            .insert([{ patient_id, physician_id, appointment_date, notes, status: 'pending' }])
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

// Update an appointment
router.put('/:id', auth(['patient', 'physician']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { id: userId, role } = req.user;

        let query = supabase.from('appointments').update({ status }).eq('id', id);

        if (role === 'patient') {
            query = query.eq('patient_id', userId);
        } else if (role === 'physician') {
            query = query.eq('physician_id', userId);
        }

        const { data, error } = await query.select('*').single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
