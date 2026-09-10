// Builds a SQL WHERE clause + params for filtering a `timestamp` column by either
// a single `date` (YYYY-MM-DD, local calendar day) or an explicit `start`/`end`
// ISO timestamp range. Falls back to "no filter" when nothing is provided.
export function buildDateFilter({ date, start, end }) {
  if (date) {
    return {
      clause: "date(timestamp) = date(?)",
      params: [date],
    };
  }
  if (start && end) {
    return {
      clause: 'timestamp >= ? AND timestamp <= ?',
      params: [start, end],
    };
  }
  if (start) {
    return { clause: 'timestamp >= ?', params: [start] };
  }
  if (end) {
    return { clause: 'timestamp <= ?', params: [end] };
  }
  return { clause: '1=1', params: [] };
}
