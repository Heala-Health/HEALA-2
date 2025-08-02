const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');
const patientRoutes = require('./routes/patient');
const physicianRoutes = require('./routes/physician');
const appointmentRoutes = require('./routes/appointments');
const healthRecordRoutes = require('./routes/health-records');
const prescriptionRoutes = require('./routes/prescriptions');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/physician', physicianRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
