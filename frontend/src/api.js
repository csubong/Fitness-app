async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
};

export const api = {
  // Food
  analyzeFoodPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/food/analyze-photo', { method: 'POST', body: form });
  },
  listFood: (params) => request(`/food${qs(params)}`),
  createFood: (entry) => request('/food', { method: 'POST', body: JSON.stringify(entry) }),
  updateFood: (id, entry) => request(`/food/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteFood: (id) => request(`/food/${id}`, { method: 'DELETE' }),

  // Water
  listWater: (params) => request(`/water${qs(params)}`),
  createWater: (entry) => request('/water', { method: 'POST', body: JSON.stringify(entry) }),
  deleteWater: (id) => request(`/water/${id}`, { method: 'DELETE' }),
  getWaterGoal: () => request('/settings/water-goal'),
  setWaterGoal: (water_goal_oz) =>
    request('/settings/water-goal', { method: 'PUT', body: JSON.stringify({ water_goal_oz }) }),

  // Workouts
  listWorkouts: (params) => request(`/workouts${qs(params)}`),
  createWorkout: (entry) => request('/workouts', { method: 'POST', body: JSON.stringify(entry) }),
  updateWorkout: (id, entry) => request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),

  // Dashboard
  getSummary: (date) => request(`/dashboard/summary${qs({ date })}`),
  getTrends: (days) => request(`/dashboard/trends${qs({ days })}`),

  // Export
  exportUrl: (type, params) => `/api/export/${type}.csv${qs(params)}`,
};
