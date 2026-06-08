const express = require('express');
const session = require('express-session');
const cors = require('cors');

const errorHandler = require('./middleware/errors');

// Routes
const authRoutes = require('./routes/auth');
const recipesRoutes = require('./routes/recipes');
const ingredientsRoutes = require('./routes/ingredients');
const unitsRoutes = require('./routes/units');
const amountsRoutes = require('./routes/amounts');
const conversionsRoutes = require('./routes/conversions');
const foamTypesRoutes = require('./routes/foamTypes');

function createApp() {
  const app = express();

  // ---- Core middleware ----
  app.use(express.json({ limit: '1mb' }));

  // CORS - allow credentialed requests from the website's origin.
  // For local dev with the website on a different port, this is required
  // so the session cookie gets sent. Adjust origin for production.
  app.use(cors({
    origin: true,        // reflect request origin
    credentials: true    // allow cookies
  }));

  // ---- Sessions ----
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not set in .env');
  }
  if (!process.env.EDIT_PASSWORD_HASH) {
    console.warn(
      '[Warn] EDIT_PASSWORD_HASH is not set in .env.\n' +
      '       The /api/auth/verify endpoint will reject all attempts.\n' +
      '       Run: npm run set-password\n'
    );
  }

  app.use(session({
    name: 'mixer.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,    // 1 day
      sameSite: 'lax'
      // secure: true     // enable when serving over HTTPS in production
    }
  }));

  // ---- Health check ----
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // ---- Mount routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/recipes', recipesRoutes);
  app.use('/api/ingredients', ingredientsRoutes);
  app.use('/api/units', unitsRoutes);
  app.use('/api/amounts', amountsRoutes);
  app.use('/api/conversions', conversionsRoutes);
  app.use('/api/foam-types', foamTypesRoutes);

  // ---- 404 for unknown /api/ ----
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Unknown endpoint: ${req.method} ${req.path}` });
  });

  // ---- Error handler (must be last) ----
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
