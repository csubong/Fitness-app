export const WORKOUT_TYPE_OPTIONS = [
  { value: 'run', label: 'Run', category: 'cardio' },
  { value: 'cycle', label: 'Cycle', category: 'cardio' },
  { value: 'swim', label: 'Swim', category: 'cardio' },
  { value: 'lift', label: 'Lift / Strength', category: 'strength' },
  { value: 'yoga', label: 'Yoga', category: 'flexibility' },
  { value: 'other', label: 'Other', category: 'other' },
];

export const emptyWorkoutForm = {
  workout_type: 'run',
  category: 'cardio',
  duration_min: '',
  distance: '',
  sets_reps: '',
  weight: '',
  perceived_effort: '',
  notes: '',
};

export function workoutFormToPayload(f) {
  return {
    workout_type: f.workout_type,
    category: f.category,
    duration_min: f.duration_min === '' ? null : Number(f.duration_min),
    distance: f.distance || null,
    sets_reps: f.sets_reps || null,
    weight: f.weight || null,
    perceived_effort: f.perceived_effort === '' ? null : Number(f.perceived_effort),
    notes: f.notes || null,
  };
}

export default function WorkoutForm({ form, setForm, onSubmit, onCancel, busy, submitLabel }) {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTypeChange = (e) => {
    const value = e.target.value;
    const option = WORKOUT_TYPE_OPTIONS.find((o) => o.value === value);
    setForm((f) => ({ ...f, workout_type: value, category: option?.category || 'other' }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="field">
        <label htmlFor="wo-type">Type</label>
        <select id="wo-type" value={form.workout_type} onChange={handleTypeChange}>
          {WORKOUT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="wo-duration">Duration (minutes)</label>
        <input id="wo-duration" type="number" inputMode="numeric" min="0" value={form.duration_min} onChange={update('duration_min')} />
      </div>

      {form.category === 'cardio' && (
        <div className="field">
          <label htmlFor="wo-distance">Distance (optional)</label>
          <input id="wo-distance" placeholder="e.g. 5 km or 3.1 mi" value={form.distance} onChange={update('distance')} />
        </div>
      )}

      {form.category === 'strength' && (
        <>
          <div className="field">
            <label htmlFor="wo-sets">Sets / reps (optional)</label>
            <input id="wo-sets" placeholder="e.g. 4x8 squat, 3x10 bench" value={form.sets_reps} onChange={update('sets_reps')} />
          </div>
          <div className="field">
            <label htmlFor="wo-weight">Weight used (optional)</label>
            <input id="wo-weight" placeholder="e.g. 135 lb" value={form.weight} onChange={update('weight')} />
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="wo-effort">Perceived effort (1–10, optional)</label>
        <input
          id="wo-effort"
          type="number"
          inputMode="numeric"
          min="1"
          max="10"
          value={form.perceived_effort}
          onChange={update('perceived_effort')}
        />
      </div>
      <div className="field">
        <label htmlFor="wo-notes">Notes (optional)</label>
        <textarea id="wo-notes" value={form.notes} onChange={update('notes')} />
      </div>
      <div className="row">
        <button type="submit" className="btn primary" disabled={busy} style={{ flex: 1 }}>
          {busy ? <span className="spinner" /> : submitLabel || 'Save workout'}
        </button>
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
