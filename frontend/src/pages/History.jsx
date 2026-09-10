import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayISODate, addDays, formatDateLabel, formatTime } from '../dateUtils.js';
import FoodEntryForm from '../components/FoodEntryForm.jsx';
import WorkoutForm, { workoutFormToPayload } from '../components/WorkoutForm.jsx';

export default function History() {
  const [date, setDate] = useState(todayISODate());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [foodEditForm, setFoodEditForm] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutEditForm, setWorkoutEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setError('');
    try {
      setSummary(await api.getSummary(date));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    setEditingFoodId(null);
    setEditingWorkoutId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function startFoodEdit(entry) {
    setEditingFoodId(entry.id);
    setFoodEditForm({
      name: entry.name || '',
      portion: entry.portion || '',
      calories: entry.calories ?? '',
      protein_g: entry.protein_g ?? '',
      carbs_g: entry.carbs_g ?? '',
      fat_g: entry.fat_g ?? '',
      notes: entry.notes || '',
    });
  }

  async function saveFoodEdit(id) {
    setSaving(true);
    try {
      await api.updateFood(id, {
        ...foodEditForm,
        calories: foodEditForm.calories === '' ? null : Number(foodEditForm.calories),
        protein_g: foodEditForm.protein_g === '' ? null : Number(foodEditForm.protein_g),
        carbs_g: foodEditForm.carbs_g === '' ? null : Number(foodEditForm.carbs_g),
        fat_g: foodEditForm.fat_g === '' ? null : Number(foodEditForm.fat_g),
      });
      setEditingFoodId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFood(id) {
    if (!confirm('Delete this food entry?')) return;
    await api.deleteFood(id);
    await refresh();
  }

  async function deleteWater(id) {
    if (!confirm('Delete this water entry?')) return;
    await api.deleteWater(id);
    await refresh();
  }

  function startWorkoutEdit(entry) {
    setEditingWorkoutId(entry.id);
    setWorkoutEditForm({
      workout_type: entry.workout_type,
      category: entry.category,
      duration_min: entry.duration_min ?? '',
      distance: entry.distance ?? '',
      sets_reps: entry.sets_reps ?? '',
      weight: entry.weight ?? '',
      perceived_effort: entry.perceived_effort ?? '',
      notes: entry.notes ?? '',
    });
  }

  async function saveWorkoutEdit(id) {
    setSaving(true);
    try {
      await api.updateWorkout(id, workoutFormToPayload(workoutEditForm));
      setEditingWorkoutId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(id) {
    if (!confirm('Delete this workout?')) return;
    await api.deleteWorkout(id);
    await refresh();
  }

  const isToday = date === todayISODate();

  return (
    <div className="page">
      <div className="page-header">
        <h1>History</h1>
      </div>

      <div className="date-nav">
        <button className="btn small" onClick={() => setDate((d) => addDays(d, -1))}>
          ‹ Prev
        </button>
        <span className="date-label">{formatDateLabel(date)}</span>
        <button className="btn small" onClick={() => setDate((d) => addDays(d, 1))} disabled={isToday}>
          Next ›
        </button>
      </div>

      {error && <div className="banner error">{error}</div>}
      {!summary && !error && <div className="empty">Loading…</div>}

      {summary && (
        <>
          <div className="card">
            <h2>Nutrition</h2>
            <div className="stat-grid">
              <div className="stat">
                <div className="value">{Math.round(summary.food.totals.calories)}</div>
                <div className="label">calories</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(summary.food.totals.protein_g)}g</div>
                <div className="label">protein</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(summary.food.totals.carbs_g)}g</div>
                <div className="label">carbs</div>
              </div>
              <div className="stat">
                <div className="value">{Math.round(summary.food.totals.fat_g)}g</div>
                <div className="label">fat</div>
              </div>
            </div>

            {summary.food.entries.length === 0 && <div className="empty">No food logged.</div>}
            {summary.food.entries.map((entry) =>
              editingFoodId === entry.id ? (
                <div key={entry.id} style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <FoodEntryForm
                    form={foodEditForm}
                    setForm={setFoodEditForm}
                    onSubmit={() => saveFoodEdit(entry.id)}
                    onCancel={() => setEditingFoodId(null)}
                    busy={saving}
                    submitLabel="Save changes"
                  />
                </div>
              ) : (
                <div className="entry" key={entry.id}>
                  <div className="entry-main">
                    <div className="entry-title">{entry.name}</div>
                    <div className="entry-meta">
                      {formatTime(entry.timestamp)}
                      {entry.portion ? ` · ${entry.portion}` : ''}
                    </div>
                    <div className="entry-meta">
                      {entry.calories ?? '–'} kcal · P {entry.protein_g ?? '–'}g · C {entry.carbs_g ?? '–'}g · F{' '}
                      {entry.fat_g ?? '–'}g
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="icon-btn" onClick={() => startFoodEdit(entry)} aria-label="Edit">
                      ✏️
                    </button>
                    <button className="icon-btn" onClick={() => deleteFood(entry.id)} aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="card">
            <h2>Water</h2>
            <div className="row between">
              <div className="value" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {summary.water.total_oz}oz <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.85rem' }}>/ {summary.water.goal_oz}oz</span>
              </div>
            </div>
            {summary.water.entries.length === 0 && <div className="empty">No water logged.</div>}
            {summary.water.entries.map((entry) => (
              <div className="entry" key={entry.id}>
                <div className="entry-main">
                  <div className="entry-title">{entry.amount_oz}oz</div>
                  <div className="entry-meta">{formatTime(entry.timestamp)}</div>
                </div>
                <div className="entry-actions">
                  <button className="icon-btn" onClick={() => deleteWater(entry.id)} aria-label="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Workouts</h2>
            {summary.workouts.length === 0 && <div className="empty">No workouts logged.</div>}
            {summary.workouts.map((entry) =>
              editingWorkoutId === entry.id ? (
                <div key={entry.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <WorkoutForm
                    form={workoutEditForm}
                    setForm={setWorkoutEditForm}
                    onSubmit={() => saveWorkoutEdit(entry.id)}
                    onCancel={() => setEditingWorkoutId(null)}
                    busy={saving}
                    submitLabel="Save changes"
                  />
                </div>
              ) : (
                <div className="entry" key={entry.id}>
                  <div className="entry-main">
                    <div className="entry-title">{entry.workout_type}</div>
                    <div className="entry-meta">
                      {formatTime(entry.timestamp)}
                      {entry.duration_min ? ` · ${entry.duration_min} min` : ''}
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="icon-btn" onClick={() => startWorkoutEdit(entry)} aria-label="Edit">
                      ✏️
                    </button>
                    <button className="icon-btn" onClick={() => deleteWorkout(entry.id)} aria-label="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="card">
            <h2>Export</h2>
            <div className="row wrap">
              <a className="btn small" href={api.exportUrl('food')} target="_blank" rel="noreferrer">
                Food CSV
              </a>
              <a className="btn small" href={api.exportUrl('water')} target="_blank" rel="noreferrer">
                Water CSV
              </a>
              <a className="btn small" href={api.exportUrl('workouts')} target="_blank" rel="noreferrer">
                Workouts CSV
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
