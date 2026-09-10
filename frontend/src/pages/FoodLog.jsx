import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { todayISODate, formatTime } from '../dateUtils.js';
import FoodEntryForm, { useFoodForm } from '../components/FoodEntryForm.jsx';

const emptyForm = {
  name: '',
  portion: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  notes: '',
};

export default function FoodLog() {
  const [mode, setMode] = useState('photo');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pendingPhotoPath, setPendingPhotoPath] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [form, setForm] = useFoodForm();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const today = todayISODate();

  async function refresh() {
    setLoading(true);
    try {
      const rows = await api.listFood({ date: today });
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

  function resetForm() {
    setForm({ ...emptyForm });
    setPhotoPreview(null);
    setPendingPhotoPath(null);
    setConfidence(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setPhotoPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      const { estimate, photo_path } = await api.analyzeFoodPhoto(file);
      setPendingPhotoPath(photo_path);
      setConfidence(estimate.confidence);
      setForm({
        name: estimate.name || '',
        portion: estimate.portion || '',
        calories: estimate.calories ?? '',
        protein_g: estimate.protein_g ?? '',
        carbs_g: estimate.carbs_g ?? '',
        fat_g: estimate.fat_g ?? '',
        notes: estimate.items?.length ? `Detected: ${estimate.items.join(', ')}` : '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.createFood({
        name: form.name,
        portion: form.portion || null,
        calories: form.calories === '' ? null : Number(form.calories),
        protein_g: form.protein_g === '' ? null : Number(form.protein_g),
        carbs_g: form.carbs_g === '' ? null : Number(form.carbs_g),
        fat_g: form.fat_g === '' ? null : Number(form.fat_g),
        notes: form.notes || null,
        source: mode === 'photo' ? 'photo' : 'manual',
        photo_path: pendingPhotoPath,
      });
      resetForm();
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
      name: entry.name || '',
      portion: entry.portion || '',
      calories: entry.calories ?? '',
      protein_g: entry.protein_g ?? '',
      carbs_g: entry.carbs_g ?? '',
      fat_g: entry.fat_g ?? '',
      notes: entry.notes || '',
    });
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      await api.updateFood(id, {
        name: editForm.name,
        portion: editForm.portion || null,
        calories: editForm.calories === '' ? null : Number(editForm.calories),
        protein_g: editForm.protein_g === '' ? null : Number(editForm.protein_g),
        carbs_g: editForm.carbs_g === '' ? null : Number(editForm.carbs_g),
        fat_g: editForm.fat_g === '' ? null : Number(editForm.fat_g),
        notes: editForm.notes || null,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this food entry?')) return;
    await api.deleteFood(id);
    await refresh();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Food</h1>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="card">
        <div className="tabs">
          <button className={mode === 'photo' ? 'active' : ''} onClick={() => { setMode('photo'); resetForm(); }}>
            📷 Photo
          </button>
          <button className={mode === 'manual' ? 'active' : ''} onClick={() => { setMode('manual'); resetForm(); }}>
            ✏️ Manual
          </button>
        </div>

        {mode === 'photo' && (
          <>
            {photoPreview && <img src={photoPreview} alt="Meal preview" className="photo-preview" />}
            <div className="field">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
              />
            </div>
            {analyzing && (
              <div className="banner info">
                <span className="spinner" /> Analyzing photo with Claude…
              </div>
            )}
            {confidence && !analyzing && (
              <div className="row" style={{ marginBottom: 12 }}>
                <span className={`pill confidence-${confidence}`}>{confidence} confidence estimate</span>
              </div>
            )}
          </>
        )}

        {!analyzing && (form.name || mode === 'manual') && (
          <>
            {mode === 'photo' && (
              <div className="banner info">
                Photo estimates are approximate — double-check and edit before saving.
              </div>
            )}
            <FoodEntryForm
              form={form}
              setForm={setForm}
              onSubmit={handleSave}
              busy={saving}
              submitLabel="Save entry"
            />
          </>
        )}
      </div>

      <div className="card">
        <h2>Today</h2>
        {loading && <div className="empty">Loading…</div>}
        {!loading && entries.length === 0 && <div className="empty">No food logged yet today.</div>}
        {!loading &&
          entries.map((entry) =>
            editingId === entry.id ? (
              <div key={entry.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <FoodEntryForm
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
