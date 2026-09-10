import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadsDir } from './db.js';

import foodRouter from './routes/food.js';
import waterRouter from './routes/water.js';
import workoutsRouter from './routes/workouts.js';
import dashboardRouter from './routes/dashboard.js';
import exportRouter from './routes/export.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Populated by the Docker build (frontend/dist copied here). Absent in local dev,
// where the Vite dev server serves the frontend instead.
const publicDir = path.join(__dirname, '..', 'public');
const hasBuiltFrontend = fs.existsSync(publicDir);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

if (hasBuiltFrontend) {
  app.use(express.static(publicDir));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/food', foodRouter);
app.use('/api/water', waterRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);
app.use('/api/settings', settingsRouter);

if (hasBuiltFrontend) {
  // SPA fallback so client-side routes (e.g. /food, /history) resolve on a hard
  // refresh or direct link instead of 404ing against Express's router.
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error', code: err.code });
});

app.listen(PORT, () => {
  console.log(`Fitness app API listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      'ANTHROPIC_API_KEY is not set — photo-based food analysis will be disabled until you add it to backend/.env'
    );
  }
});
