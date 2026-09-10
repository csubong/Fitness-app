import { Router } from 'express';
import { db } from '../db.js';
import { buildDateFilter } from '../utils/dateRange.js';

const router = Router();

router.get('/', (req, res) => {
  const { clause, params } = buildDateFilter(req.query);
  const rows = db
    .prepare(`SELECT * FROM workouts WHERE ${clause} ORDER BY timestamp DESC`)
    .all(...params);
  res.json(rows);
});

router.post('/', (req, res) => {
  const body = req.body;
  if (!body.workout_type) return res.status(400).json({ error: 'workout_type is required' });

  const result = db
    .prepare(
      `INSERT INTO workouts (timestamp, workout_type, category, duration_min, distance, sets_reps, weight, perceived_effort, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.timestamp || new Date().toISOString(),
      body.workout_type,
      body.category || 'other',
      body.duration_min ?? null,
      body.distance ?? null,
      body.sets_reps ?? null,
      body.weight ?? null,
      body.perceived_effort ?? null,
      body.notes ?? null
    );

  const row = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE workouts SET
      timestamp = ?, workout_type = ?, category = ?, duration_min = ?, distance = ?,
      sets_reps = ?, weight = ?, perceived_effort = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.timestamp,
    merged.workout_type,
    merged.category,
    merged.duration_min,
    merged.distance,
    merged.sets_reps,
    merged.weight,
    merged.perceived_effort,
    merged.notes,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
