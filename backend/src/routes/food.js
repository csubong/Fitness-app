import { Router } from 'express';
import fs from 'node:fs';
import { db } from '../db.js';
import { upload } from '../middleware/upload.js';
import { analyzeFoodPhoto } from '../services/claudeVision.js';
import { buildDateFilter } from '../utils/dateRange.js';

const router = Router();

// Analyze a photo with Claude vision. Does NOT save an entry — returns an editable
// estimate that the client saves via POST /api/food once the user confirms/edits it.
router.post('/analyze-photo', upload.single('photo'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo uploaded (expected field "photo")' });
  }
  try {
    const estimate = await analyzeFoodPhoto({
      filePath: req.file.path,
      mimeType: req.file.mimetype,
    });
    res.json({
      estimate,
      // relative path the client should submit back when saving the entry
      photo_path: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    // Clean up the uploaded file if analysis failed outright.
    fs.unlink(req.file.path, () => {});
    err.status = err.code === 'MISSING_API_KEY' || err.code === 'UNSUPPORTED_MEDIA_TYPE' ? 400 : 502;
    next(err);
  }
});

router.get('/', (req, res) => {
  const { clause, params } = buildDateFilter(req.query);
  const rows = db
    .prepare(`SELECT * FROM food_entries WHERE ${clause} ORDER BY timestamp DESC`)
    .all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const {
    timestamp,
    name,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    portion,
    source,
    photo_path,
    notes,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db
    .prepare(
      `INSERT INTO food_entries
        (timestamp, name, calories, protein_g, carbs_g, fat_g, portion, source, photo_path, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      timestamp || new Date().toISOString(),
      name,
      calories ?? null,
      protein_g ?? null,
      carbs_g ?? null,
      fat_g ?? null,
      portion ?? null,
      source || 'manual',
      photo_path ?? null,
      notes ?? null
    );

  const row = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE food_entries SET
      timestamp = ?, name = ?, calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?,
      portion = ?, source = ?, photo_path = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.timestamp,
    merged.name,
    merged.calories,
    merged.protein_g,
    merged.carbs_g,
    merged.fat_g,
    merged.portion,
    merged.source,
    merged.photo_path,
    merged.notes,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM food_entries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
