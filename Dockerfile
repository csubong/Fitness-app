# Builds the frontend and backend into a single image that serves both the
# React app and the API from one Express process on one port.

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-bookworm-slim AS backend-deps
# better-sqlite3 needs to compile its native addon if no prebuilt binary
# matches this platform/Node version.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/package.json ./package.json
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./public

# SQLite DB file + uploaded photos live here — mount a volume at this path so
# data survives redeploys/restarts.
VOLUME ["/app/backend/data"]

EXPOSE 3001
CMD ["node", "src/index.js"]
