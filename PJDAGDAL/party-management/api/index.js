import express from 'express';
import serverless from 'serverless-http';
import mongoose from 'mongoose';
import { connectToDatabase } from '../utils/db.js';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import memberRoutes from '../routes/members.js';
import activityRoutes from '../routes/activities.js';
import attendanceRoutes from '../routes/attendance.js';
import userRoutes from '../routes/users.js';
import dashboardRoutes from '../routes/dashboard.js';
import memberDashboardRoutes from '../routes/memberDashboard.js';
import activityDashboardRoutes from '../routes/activityDashboard.js';
import attendanceDashboardRoutes from '../routes/attendanceDashboard.js';
import attendanceReportRoutes from '../routes/attendanceReport.js';
import authRoutes from '../routes/auth.js';
import exportRoutes from '../routes/export.js';
import hundelRoutes from '../routes/hundels.js';
import hundelAdminRoutes from '../routes/hundelAdmin.js';
import auditRoutes from '../routes/audit.js';
import uiAuth from '../middlewares/uiAuth.js';
import uiAdmin from '../middlewares/uiAdmin.js';
import attachUser from '../middlewares/attachUser.js';
import { register, registerAllowed, login } from '../controllers/authController.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

// Attach user middleware
app.use(attachUser);

// Auth routes
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, handler: (req, res) => res.status(429).json({ message: 'Too many requests' }) });
app.use('/api/auth', authLimiter, authRoutes);
// fallback direct handlers
app.get('/api/auth/register-allowed', async (req, res) => registerAllowed(req, res));
app.post('/api/auth/register', async (req, res) => register(req, res));
app.post('/api/auth/login', async (req, res) => login(req, res));
app.get('/api/auth/register', (req, res) => res.redirect('/register'));

// other api routes
app.use('/api/members', memberRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/hundels', hundelRoutes);

// UI routes
app.use(uiAuth);
app.use('/', dashboardRoutes);
app.use('/members', memberDashboardRoutes);
app.use('/activities', activityDashboardRoutes);
app.use('/attendance', attendanceDashboardRoutes);
app.use('/attendance-report', attendanceReportRoutes);
app.use('/hundels', uiAdmin, hundelAdminRoutes);
app.use('/audit-logs', uiAdmin, auditRoutes);

// Simple route to match original server's fallback
app.post('/login', async (req, res) => { try { await login(req, res); } catch (err) { console.error(err); res.status(500).send('Internal server error'); } });
app.get('/api/auth/me', async (req, res) => { try { /* middleware authenticate not wired here; rely on attachUser */ res.json({ user: req.user }); } catch (err) { res.status(500).json({ message: err.message }); } });

// Connect to MongoDB (reuse connection across invocations)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) console.warn('No MongoDB URI provided in environment for Vercel deployment');

// Attempt to connect on module init but do not block export. connectToDatabase
// caches the promise globally so subsequent invocations reuse the same
// connection and avoid reconnect storms.
if (mongoUri) {
  connectToDatabase(mongoUri)
    .then(() => console.log('MongoDB connected (serverless)'))
    .catch((err) => console.error('MongoDB connection error (serverless):', err && err.message ? err.message : err));
}

export default serverless(app);
