import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/water-goal', (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'water_goal_oz'").get();
  res.json({ water_goal_oz: Number(row?.value ?? 64) });
});

router.put('/water-goal', (req, res) => {
  const goal = Number(req.body.water_goal_oz);
  if (!Number.isFinite(goal) || goal <= 0) {
    return res.status(400).json({ error: 'water_goal_oz must be a positive number' });
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('water_goal_oz', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(goal));
  res.json({ water_goal_oz: goal });
});

export default router;
