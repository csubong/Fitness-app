# Health Tracker

A mobile-first personal health tracking web app: log meals (by photo or manually), water
intake, and workouts, then review a daily dashboard, browsable history, and trend charts.
Built for local/personal use.

- **Frontend:** React 18 + Vite, mobile-first CSS (dark theme, bottom tab nav, one-handed
  layout), charts via Recharts.
- **Backend:** Node.js + Express, SQLite storage (via `better-sqlite3`) — a single file on
  disk, no separate database server to run.
- **Photo food logging:** the backend sends your meal photo to the Claude API (vision) to
  get a nutrition estimate, which you review and edit before saving.

## Project structure

```
Fitness-app/
  backend/
    src/
      index.js            # Express app entry
      db.js                # SQLite schema + connection
      routes/               # food, water, workouts, dashboard, export, settings
      services/claudeVision.js  # Claude API integration for photo analysis
      middleware/upload.js  # multer config for photo uploads
      utils/dateRange.js
    data/                  # SQLite DB file + uploaded photos (gitignored, created at runtime)
    .env.example
  frontend/
    src/
      pages/               # Dashboard, FoodLog, Water, Workouts, History
      components/          # NavBar, forms, TrendChart
      api.js                # fetch wrapper for the backend API
      dateUtils.js
      styles/index.css
```

## Data model

SQLite tables (see `backend/src/db.js` for the full schema):

- **food_entries** — `timestamp, name, calories, protein_g, carbs_g, fat_g, portion, source
  (photo|manual), photo_path, notes`
- **water_entries** — `timestamp, amount_oz`
- **workouts** — `timestamp, workout_type, category (cardio|strength|flexibility|other),
  duration_min, distance, sets_reps, weight, perceived_effort, notes`
- **settings** — key/value store (currently just `water_goal_oz`)

All entries are timestamped and queryable by day or date range, which is what powers the
daily summary, history, and trend views.

## Setup

Requires Node.js 18+.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-... to enable photo-based food logging
npm start
```

The API runs on `http://localhost:3001`. On first run it creates `backend/data/fitness.db`
and `backend/data/uploads/` automatically — your data persists there between restarts.

Photo-based food analysis requires `ANTHROPIC_API_KEY`. Everything else (manual food entry,
water, workouts, dashboard, history) works without it.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` on your computer, or from your phone on the same Wi-Fi network
visit `http://<your-computer's-LAN-IP>:5173` (Vite prints this as the "Network" URL when it
starts). The dev server proxies `/api` and `/uploads` requests to the backend, so both need
to be running.

### 3. Production-ish local build (optional)

```bash
cd frontend
npm run build
npm run preview   # serves the built app, still talking to the backend on :3001
```

## Using it

- **Food** — snap/upload a photo of a meal to get a Claude-generated nutrition estimate
  (name, portion, calories, macros), or switch to Manual to type it in directly. Either way,
  review and edit the numbers before saving — see the assumptions section below.
- **Water** — quick-add buttons for 8/16/32oz, a custom-amount field, and an editable daily
  goal with a progress bar.
- **Workouts** — log cardio (run/cycle/swim) or strength (lift) sessions; the form adapts to
  show distance for cardio or sets/reps/weight for strength, plus optional duration,
  perceived effort (1–10), and free-text notes for anything else (yoga, etc.).
- **Dashboard** — today's totals (calories/macros, water vs. goal, workouts) plus 7-day/30-day
  trend charts for calories, water, and workout frequency.
- **History** — step backward/forward through past days, see that day's full summary, and
  edit or delete any past entry. Also has CSV export links for food/water/workouts.

## Assumptions & caveats about the nutrition estimation

- **Photo estimates are approximations, not measurements.** Claude is estimating calories
  and macros from a single photo — it can't weigh food, doesn't know your specific recipe or
  cooking method, and portion sizes are visually inferred. Treat the numbers as a reasonable
  starting point, always reviewable/editable before you save.
- Each photo estimate returns a rough `confidence` level (low/medium/high) shown next to the
  form so you know how much to trust that particular estimate.
- If multiple foods are visible in one photo, they're combined into a single meal-level
  estimate rather than split into separate entries.
- Supported image types for analysis are JPEG, PNG, WEBP, and GIF. Some phone cameras save
  photos as HEIC by default — if analysis fails on a HEIC upload, switch your camera/photos
  app to save as JPEG, or just use manual entry.
- The vision model used is configurable via `CLAUDE_VISION_MODEL` in `backend/.env` (defaults
  to `claude-sonnet-5`).

## Notes on extending this later

- The Express routes and SQLite schema are deliberately flat (one table per concern, plain
  columns) so adding a field (e.g. a new macro, a workout metric) is a small migration plus a
  form field — no ORM layer to fight.
- `backend/src/utils/dateRange.js` centralizes day/range filtering so new endpoints can reuse
  it instead of re-deriving date logic.
- CSV export already exists per data type (`GET /api/export/:type.csv`); a combined/date-range
  export would just mean adding query params to that same route.
- Multi-day or multi-metric goals could extend the existing `settings` key/value table rather
  than needing a new table.

## Known limitations (not implemented)

- Single-user, no authentication — this is meant to run locally for personal use.
- No automated test suite.
