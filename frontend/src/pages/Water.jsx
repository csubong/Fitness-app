import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayISODate, formatTime } from '../dateUtils.js';

const QUICK_AMOUNTS = [8, 16, 32];

export default function Water() {
  const [entries, setEntries] = useState([]);
  const [goal, setGoal] = useState(64);
  const [goalInput, setGoalInput] = useState('64');
  const [editingGoal, setEditingGoal] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = todayISODate();

  async function refresh() {
    setLoading(true);
    try {
      const [rows, goalData] = await Promise.all([api.listWater({ date: today }), api.getWaterGoal()]);
      setEntries(rows);
      setGoal(goalData.water_goal_oz);
      setGoalInput(String(goalData.water_goal_oz));
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

  const total = entries.reduce((sum, e) => sum + e.amount_oz, 0);
  const pct = Math.min(100, Math.round((total / goal) * 100));

  async function addWater(amount) {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    setError('');
    try {
      await api.createWater({ amount_oz: amt });
      setManualAmount('');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteWater(id);
    await refresh();
  }

  async function saveGoal() {
    const g = Number(goalInput);
    if (!Number.isFinite(g) || g <= 0) return;
    await api.setWaterGoal(g);
    setEditingGoal(false);
    await refresh();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Water</h1>
      </div>

      {error && <div className="banner error">{error}</div>}

      <div className="card">
        <div className="row between">
          <div>
            <div className="stat">
              <div className="value">{total}oz</div>
              <div className="label">of {goal}oz goal</div>
            </div>
          </div>
          {editingGoal ? (
            <div className="row">
              <input
                style={{
                  width: 80,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
                type="number"
                inputMode="numeric"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />
              <button className="btn small primary" onClick={saveGoal}>
                Save
              </button>
            </div>
          ) : (
            <button className="btn small ghost" onClick={() => setEditingGoal(true)}>
              Edit goal
            </button>
          )}
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card">
        <h2>Quick add</h2>
        <div className="btn-grid">
          {QUICK_AMOUNTS.map((amt) => (
            <button key={amt} className="btn accent" onClick={() => addWater(amt)}>
              +{amt}oz
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Custom oz"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          />
          <button className="btn primary" onClick={() => addWater(manualAmount)}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Today's log</h2>
        {loading && <div className="empty">Loading…</div>}
        {!loading && entries.length === 0 && <div className="empty">No water logged yet today.</div>}
        {!loading &&
          entries.map((entry) => (
            <div className="entry" key={entry.id}>
              <div className="entry-main">
                <div className="entry-title">{entry.amount_oz}oz</div>
                <div className="entry-meta">{formatTime(entry.timestamp)}</div>
              </div>
              <div className="entry-actions">
                <button className="icon-btn" onClick={() => handleDelete(entry.id)} aria-label="Delete">
                  🗑️
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
