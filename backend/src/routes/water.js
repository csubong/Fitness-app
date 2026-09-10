import { Router } from 'express';
import { db } from '../db.js';
import { buildDateFilter } from '../utils/dateRange.js';

const router = Router();

router.get('/', (req, res) => {
  const { clause, params } = buildDateFilter(req.query);
  const rows = db
    .prepare(`SELECT * FROM water_entries WHERE ${clause} ORDER BY timestamp DESC`)
    .all(...params);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { timestamp, amount_oz } = req.body;
  const amount = Number(amount_oz);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount_oz must be a positive number' });
  }

  const result = db
    .prepare('INSERT INTO water_entries (timestamp, amount_oz) VALUES (?, ?)')
    .run(timestamp || new Date().toISOString(), amount);

  const row = db.prepare('SELECT * FROM water_entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM water_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const merged = { ...existing, ...req.body };
  db.prepare('UPDATE water_entries SET timestamp = ?, amount_oz = ? WHERE id = ?').run(
    merged.timestamp,
    merged.amount_oz,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM water_entries WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM water_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM water_entries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
