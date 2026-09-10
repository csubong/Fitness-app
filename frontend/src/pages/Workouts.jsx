import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayISODate, formatTime } from '../dateUtils.js';
import WorkoutForm, {
  WORKOUT_TYPE_OPTIONS as TYPE_OPTIONS,
  emptyWorkoutForm as emptyForm,
  workoutFormToPayload,
} from '../components/WorkoutForm.jsx';

export default function Workouts() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const today = todayISODate();

  async function refresh() {
    setLoading(true);
    try {
      const rows = await api.listWorkouts({ date: today });
      setEntries(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.createWorkout(workoutFormToPayload(form));
      setForm({ ...emptyForm });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditForm({
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

  async function saveEdit(id) {
    setSaving(true);
    try {
      await api.updateWorkout(id, workoutFormToPayload(editForm));
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this workout?')) return;
    await api.deleteWorkout(id);
    await refresh();
  }

  function summarize(entry) {
    const parts = [];
    if (entry.duration_min) parts.push(`${entry.duration_min} min`);
    if (entry.distance) parts.push(entry.distance);
    if (entry.sets_reps) parts.push(entry.sets_reps);
    if (entry.weight) parts.push(entry.weight);
    if (entry.perceived_effort) parts.push(`RPE ${entry.perceived_effort}`);
    return parts.join(' · ');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Workouts</h1>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="card">
        <h2>Log a workout</h2>
        <WorkoutForm form={form} setForm={setForm} onSubmit={handleSave} busy={saving} />
      </div>

      <div className="card">
        <h2>Today</h2>
        {loading && <div className="empty">Loading…</div>}
        {!loading && entries.length === 0 && <div className="empty">No workouts logged yet today.</div>}
        {!loading &&
          entries.map((entry) =>
            editingId === entry.id ? (
              <div key={entry.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <WorkoutForm
                  form={editForm}
                  setForm={setEditForm}
                  onSubmit={() => saveEdit(entry.id)}
                  onCancel={() => setEditingId(null)}
                  busy={saving}
                  submitLabel="Save changes"
                />
              </div>
            ) : (
              <div className="entry" key={entry.id}>
                <div className="entry-main">
                  <div className="entry-title">
                    {TYPE_OPTIONS.find((o) => o.value === entry.workout_type)?.label || entry.workout_type}
                  </div>
                  <div className="entry-meta">{formatTime(entry.timestamp)}</div>
                  <div className="entry-meta">{summarize(entry) || '–'}</div>
                  {entry.notes && <div className="entry-meta">{entry.notes}</div>}
                </div>
                <div className="entry-actions">
                  <button className="icon-btn" onClick={() => startEdit(entry)} aria-label="Edit">
                    ✏️
                  </button>
                  <button className="icon-btn" onClick={() => handleDelete(entry.id)} aria-label="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            )
          )}
      </div>
    </div>
  );
}
