import { Router } from 'express';
import { db } from '../db.js';
import { buildDateFilter } from '../utils/dateRange.js';

const router = Router();

const TABLES = {
  food: {
    table: 'food_entries',
    columns: ['id', 'timestamp', 'name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'portion', 'source', 'notes'],
  },
  water: {
    table: 'water_entries',
    columns: ['id', 'timestamp', 'amount_oz'],
  },
  workouts: {
    table: 'workouts',
    columns: ['id', 'timestamp', 'workout_type', 'category', 'duration_min', 'distance', 'sets_reps', 'weight', 'perceived_effort', 'notes'],
  },
};

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

router.get('/:type.csv', (req, res) => {
  const spec = TABLES[req.params.type];
  if (!spec) return res.status(404).json({ error: 'Unknown export type' });

  const { clause, params } = buildDateFilter(req.query);
  const rows = db
    .prepare(`SELECT * FROM ${spec.table} WHERE ${clause} ORDER BY timestamp ASC`)
    .all(...params);

  const lines = [spec.columns.join(',')];
  for (const row of rows) {
    lines.push(spec.columns.map((col) => toCsvValue(row[col])).join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}.csv"`);
  res.send(lines.join('\n'));
});

export default router;
