import dotenv from 'dotenv';
dotenv.config();
console.log('🔧 Loaded env – PORT =', process.env.PORT);

if (!process.env.JWT_SECRET) {
    console.error('⚠️ WARNING: JWT_SECRET is not defined in the environment variables!');
}

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import meetingRoutes from './routes/meetings';
import aiRoutes from './routes/ai';
import invoiceRoutes from './routes/invoices';
import bookingRoutes from './routes/bookings';
import dashboardRoutes from './routes/dashboard';
import fileRoutes from './routes/files';
import { setupCronJobs } from './utils/cron';

import { prisma } from './lib/prisma';
const app = express();
const PORT = Number(process.env.PORT) || 5000;
if (isNaN(PORT) || PORT <= 0) {
    console.error('❌ Invalid PORT value. Check .env or environment variables.');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.headers.authorization) {
        console.log(`Auth Header: ${req.headers.authorization.substring(0, 15)}...`);
    } else {
        console.log('No Auth Header');
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', fileRoutes);

app.get('/', (req, res) => {
    res.send('EditPro Studio Manager API');
});

// Initialize Cron Jobs
setupCronJobs();

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
