const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../lib/supabaseClient');

// Get all prescriptions for a patient
router.get('/', auth(['patient', 'physician']), async (req, res) => {
    try {
        const { id, role } = req.user;
        let query = supabase.from('prescriptions').select('*');

        if (role === 'patient') {
            query = query.eq('patient_id', id);
        } else if (role === 'physician') {
            // Fetch prescriptions for patients associated with this physician
            const { data: physicianPatients, error: physicianPatientsError } = await supabase
                .from('profiles') // Assuming 'profiles' table links physicians to patients via patient_id or similar
                .select('patient_id') // Adjust 'patient_id' if the column name is different in your schema
                .eq('id', id) // This is the physician's ID
                .eq('role', 'patient'); // Ensure we are fetching patient IDs

            if (physicianPatientsError) {
                console.error('Error fetching physician patients:', physicianPatientsError);
                return res.status(500).json({ error: 'Failed to fetch physician patients' });
            }

            const patientIds = physicianPatients.map(p => p.patient_id);
            if (patientIds.length > 0) {
                query = query.in('patient_id', patientIds);
            } else {
                // If physician has no patients, return empty array
                res.json([]);
                return;
            }
        }

        const { data, error } = await query.select('*'); // Ensure select('*') is used

        if (error) {
            console.error('Error fetching prescriptions:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Error in GET /prescriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new prescription
router.post('/', auth(['physician']), async (req, res) => {
    try {
        const { patient_id, medication, dosage, instructions } = req.body;
        const { id: physician_id } = req.user;

        const { data, error } = await supabase
            .from('prescriptions')
            .insert([{ patient_id, physician_id, medication, dosage, instructions }])
            .select('*')
            .single();

        if (error) {
            console.error('Error creating prescription:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error in POST /prescriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
