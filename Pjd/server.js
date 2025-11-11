// Root server launcher
// Loads root .env (if present), ensures the server serves the built client, and starts the API.
const path = require('path');
const fs = require('fs');

// Prefer project-root .env if present by pointing DOTENV_CONFIG_PATH so server/src/index.js loads it
const projectEnv = path.join(__dirname, '.env');
if (fs.existsSync(projectEnv)) {
  process.env.DOTENV_CONFIG_PATH = projectEnv;
  console.log('Will load .env from', projectEnv);
} else {
  console.log('No root .env found; server will use its own env resolution.');
}

// Ensure the server serves the built client
if (!process.env.SERVE_CLIENT) process.env.SERVE_CLIENT = 'true';

// Start the API server (server/src/index.js will create and listen)
try {
  require('./server/src/index.js');
} catch (err) {
  console.error('Failed to start server from root launcher:', err && err.stack ? err.stack : err);
  process.exit(1);
}
