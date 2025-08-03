import express from 'express';
import { createServer } from 'http';
import { SocketServer } from './socket/socketServer.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// Import middleware
import { fileErrorHandler } from './middleware/fileErrorHandler.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO server
const socketServer = new SocketServer(httpServer);

// Make socket server available to routes
app.set('socketServer', socketServer);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', fileRoutes);

// Error handling middleware for files
app.use(fileErrorHandler);

export { app, httpServer, socketServer };
