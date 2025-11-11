// Load environment variables. Priority:
// 1. If DOTENV_CONFIG_PATH is set, use it.
// 2. Else if a project-root .env exists (two levels up from this file), use it.
// 3. Else use the server/.env (one level up from this file).
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let dotenvPath;
if (process.env.DOTENV_CONFIG_PATH) {
  dotenvPath = process.env.DOTENV_CONFIG_PATH;
} else {
  const projectRootEnv = path.join(__dirname, '..', '..', '.env');
  const serverEnv = path.join(__dirname, '..', '.env');
  if (fs.existsSync(projectRootEnv)) dotenvPath = projectRootEnv;
  else if (fs.existsSync(serverEnv)) dotenvPath = serverEnv;
}
if (dotenvPath) {
  dotenv.config({ path: dotenvPath });
  console.log('Loaded .env from', dotenvPath);
} else {
  // Still attempt default load
  dotenv.config();
  console.log('Loaded .env using default dotenv resolution');
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// `path` is already required above when loading dotenv resolution

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const activityRoutes = require('./routes/activities');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
// Setup routes (create admin) - mounted before auth so setup can run without token
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// Basic health endpoint for the API
app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Membership and Activity Management API' }));

// Optionally serve a built client (Vite build output) when SERVE_CLIENT=true
// The built client is expected at ../client/dist relative to this file (server/src)
if (process.env.SERVE_CLIENT === 'true') {
  const staticDir = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(staticDir));
  // SPA fallback — avoid hijacking /api routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  // When not serving the client, expose a root API message
  app.get('/', (req, res) => res.json({ ok: true, message: 'Membership and Activity Management API' }));
}

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mam_system';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    // Optionally create a default admin user on startup when CREATE_ADMIN_ON_START=true
    const createAdminOnStart = process.env.CREATE_ADMIN_ON_START === 'true';
    if (createAdminOnStart) {
      (async function ensureAdmin(){
        try {
          const bcrypt = require('bcryptjs');
          const User = require('./models/User');
          const adminUser = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
          const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
          if (!adminUser) {
            const hash = await bcrypt.hash(adminPassword, 10);
            const u = new User({ username: process.env.ADMIN_USERNAME || 'admin', password: hash, role: 'Admin' });
            await u.save();
            console.log('Default admin created:', u.username);
          } else {
            console.log('Admin user already exists:', adminUser.username);
          }
        } catch (err) {
          console.error('Error ensuring admin user:', err.message);
        }
      })();
    }

    app.listen(PORT, () => console.log('Server running on port', PORT));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
