import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function todayLocalISODate() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/summary', (req, res) => {
  const date = req.query.date || todayLocalISODate();

  const food = db
    .prepare('SELECT * FROM food_entries WHERE date(timestamp) = date(?) ORDER BY timestamp ASC')
    .all(date);

  const foodTotals = food.reduce(
    (acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein_g += entry.protein_g || 0;
      acc.carbs_g += entry.carbs_g || 0;
      acc.fat_g += entry.fat_g || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const water = db
    .prepare('SELECT * FROM water_entries WHERE date(timestamp) = date(?) ORDER BY timestamp ASC')
    .all(date);
  const waterTotalOz = water.reduce((sum, entry) => sum + entry.amount_oz, 0);
  const goalRow = db.prepare("SELECT value FROM settings WHERE key = 'water_goal_oz'").get();

  const workouts = db
    .prepare('SELECT * FROM workouts WHERE date(timestamp) = date(?) ORDER BY timestamp ASC')
    .all(date);

  res.json({
    date,
    food: { entries: food, totals: foodTotals },
    water: { entries: water, total_oz: waterTotalOz, goal_oz: Number(goalRow?.value ?? 64) },
    workouts,
  });
});

router.get('/trends', (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

  const calorieRows = db
    .prepare(
      `SELECT date(timestamp) AS day, SUM(calories) AS calories
       FROM food_entries
       WHERE date(timestamp) >= date('now', ?)
       GROUP BY day`
    )
    .all(`-${days - 1} days`);

  const waterRows = db
    .prepare(
      `SELECT date(timestamp) AS day, SUM(amount_oz) AS water_oz
       FROM water_entries
       WHERE date(timestamp) >= date('now', ?)
       GROUP BY day`
    )
    .all(`-${days - 1} days`);

  const workoutRows = db
    .prepare(
      `SELECT date(timestamp) AS day, COUNT(*) AS workout_count, SUM(duration_min) AS duration_min
       FROM workouts
       WHERE date(timestamp) >= date('now', ?)
       GROUP BY day`
    )
    .all(`-${days - 1} days`);

  const byDay = new Map();
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, calories: 0, water_oz: 0, workout_count: 0, duration_min: 0 });
  }

  for (const row of calorieRows) {
    if (byDay.has(row.day)) byDay.get(row.day).calories = row.calories || 0;
  }
  for (const row of waterRows) {
    if (byDay.has(row.day)) byDay.get(row.day).water_oz = row.water_oz || 0;
  }
  for (const row of workoutRows) {
    if (byDay.has(row.day)) {
      byDay.get(row.day).workout_count = row.workout_count || 0;
      byDay.get(row.day).duration_min = row.duration_min || 0;
    }
  }

  res.json({ days: Array.from(byDay.values()) });
});

export default router;
