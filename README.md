# cfduel

codeforce dueling app

## Layout

- `backend/` — Express API (Node.js, PostgreSQL)
- `frontend/` — React app (Vite)
- `docs/` — API documentation ([`openapi.yaml`](docs/openapi.yaml))

## Prerequisites

- Node.js 22+
- PostgreSQL 16 (Homebrew on macOS recommended):
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```

## Backend

All commands in this section run from `backend/`.

### Setup

```bash
cd backend
npm install
cp .env.example .env          # then replace USER with your macOS username (run `whoami`)
createdb cfduel
psql -d cfduel -f migrations/001_users.sql
```

### Running the server

```bash
npm start                     # http://localhost:3000
```

The API is documented in [`docs/openapi.yaml`](docs/openapi.yaml).

### Running tests

Tests use a separate database, `cfduel_test`, which they wipe and rebuild on every run.

```bash
createdb cfduel_test
```

Create `backend/.env.test` (gitignored), with `USER` replaced by your username:

```
DATABASE_URL=postgres://USER@localhost:5432/cfduel_test
NODE_ENV=test
```

Then:

```bash
npm test                      # all tests
npm run test:unit             # unit tests only (no database needed)
npm run test:integration      # integration tests only (Postgres must be running)
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
