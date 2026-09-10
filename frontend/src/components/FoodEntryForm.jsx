import { useState } from 'react';

const emptyForm = {
  name: '',
  portion: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  notes: '',
};

export function useFoodForm(initial) {
  return useState(() => ({ ...emptyForm, ...initial }));
}

export default function FoodEntryForm({ form, setForm, onSubmit, onCancel, submitLabel, busy }) {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="field">
        <label htmlFor="food-name">Food / meal</label>
        <input id="food-name" value={form.name} onChange={update('name')} required placeholder="e.g. Chicken burrito bowl" />
      </div>
      <div className="field">
        <label htmlFor="food-portion">Portion</label>
        <input id="food-portion" value={form.portion} onChange={update('portion')} placeholder="e.g. 1 bowl (~16oz)" />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="food-cal">Calories</label>
          <input id="food-cal" type="number" inputMode="decimal" min="0" value={form.calories} onChange={update('calories')} />
        </div>
        <div className="field">
          <label htmlFor="food-protein">Protein (g)</label>
          <input id="food-protein" type="number" inputMode="decimal" min="0" value={form.protein_g} onChange={update('protein_g')} />
        </div>
        <div className="field">
          <label htmlFor="food-carbs">Carbs (g)</label>
          <input id="food-carbs" type="number" inputMode="decimal" min="0" value={form.carbs_g} onChange={update('carbs_g')} />
        </div>
        <div className="field">
          <label htmlFor="food-fat">Fat (g)</label>
          <input id="food-fat" type="number" inputMode="decimal" min="0" value={form.fat_g} onChange={update('fat_g')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="food-notes">Notes (optional)</label>
        <textarea id="food-notes" value={form.notes} onChange={update('notes')} />
      </div>
      <div className="row">
        <button type="submit" className="btn primary" disabled={busy} style={{ flex: 1 }}>
          {busy ? <span className="spinner" /> : submitLabel || 'Save entry'}
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
