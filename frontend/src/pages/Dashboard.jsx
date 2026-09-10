import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatTime } from '../dateUtils.js';
import TrendChart from '../components/TrendChart.jsx';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [trendDays, setTrendDays] = useState(7);
  const [error, setError] = useState('');

  async function loadSummary() {
    try {
      setSummary(await api.getSummary());
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTrends(days) {
    try {
      setTrends(await api.getTrends(days));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadTrends(trendDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendDays]);

  if (error) return <div className="page"><div className="banner error">{error}</div></div>;
  if (!summary) return <div className="page"><div className="empty">Loading…</div></div>;

  const { food, water, workouts } = summary;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Today</h1>
      </div>

      <div className="card">
        <h2>Nutrition</h2>
        <div className="stat-grid">
          <div className="stat">
            <div className="value">{Math.round(food.totals.calories)}</div>
            <div className="label">calories</div>
          </div>
          <div className="stat">
            <div className="value">{Math.round(food.totals.protein_g)}g</div>
            <div className="label">protein</div>
          </div>
          <div className="stat">
            <div className="value">{Math.round(food.totals.carbs_g)}g</div>
            <div className="label">carbs</div>
          </div>
          <div className="stat">
            <div className="value">{Math.round(food.totals.fat_g)}g</div>
            <div className="label">fat</div>
          </div>
        </div>
        <div className="entry-meta" style={{ marginTop: 10 }}>{food.entries.length} meal(s) logged</div>
      </div>

      <div className="card">
        <h2>Water</h2>
        <div className="row between">
          <div className="value" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {water.total_oz}oz <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.9rem' }}>/ {water.goal_oz}oz</span>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 8 }}>
          <div style={{ width: `${Math.min(100, Math.round((water.total_oz / water.goal_oz) * 100))}%` }} />
        </div>
      </div>

      <div className="card">
        <h2>Workouts</h2>
        {workouts.length === 0 && <div className="empty">No workouts logged yet today.</div>}
        {workouts.map((w) => (
          <div className="entry" key={w.id}>
            <div className="entry-main">
              <div className="entry-title">{w.workout_type}</div>
              <div className="entry-meta">
                {formatTime(w.timestamp)}
                {w.duration_min ? ` · ${w.duration_min} min` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Trends</h2>
          <div className="tabs" style={{ margin: 0, width: 140 }}>
            <button className={trendDays === 7 ? 'active' : ''} onClick={() => setTrendDays(7)}>
              7d
            </button>
            <button className={trendDays === 30 ? 'active' : ''} onClick={() => setTrendDays(30)}>
              30d
            </button>
          </div>
        </div>

        {trends && (
          <>
            <div style={{ marginTop: 16 }}>
              <div className="entry-meta" style={{ marginBottom: 4 }}>Calories per day</div>
              <TrendChart data={trends.days} dataKey="calories" color="var(--accent)" unit=" kcal" />
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="entry-meta" style={{ marginBottom: 4 }}>Water intake (oz)</div>
              <TrendChart data={trends.days} dataKey="water_oz" color="#38bdf8" unit="oz" />
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="entry-meta" style={{ marginBottom: 4 }}>Workout frequency</div>
              <TrendChart data={trends.days} dataKey="workout_count" color="var(--accent-2)" unit=" workouts" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
