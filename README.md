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

#### Mac
```bash
cd backend
npm install
cp .env.example .env          # then replace USER with your macOS username (run `whoami`)
createdb cfduel
psql -d cfduel -f migrations/001_users.sql
psql -d cfduel -f migrations/002_duels.sql
```

#### Windows
```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL in .env
docker run --name cfduel-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cfduel -p 5432:5432 -d postgres:16 # first time only!
docker start cfduel-postgres
docker exec -i cfduel-postgres psql -U postgres -d cfduel < migrations/001_users.sql
docker exec -i cfduel-postgres psql -U postgres -d cfduel < migrations/002_duels.sql
```

After copying .env.example to .env, set JWT_SECRET to a randomly generated secret. The backend will not start without it.

Generate a secret using:
```
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

For Windows, the database connection string is DATABASE_URL=postgres://postgres:postgres@localhost:5432/cfduel. 
Change FRONTEND_ORIGIN to the origin you use in development/deployment (eg 127.0.0.1:5173), and change PORT to the port of the express server.

In the frontend, similarly create a new .env file, and configure VITE_API_URL to your local URL. 
**Ensure that the url does NOT contain a trailing /, as this will cause an invalid URL access.**

### Resetting the database (local development only)

**WARNING: The following commands permanently delete ALL data in the local `cfduel` database, including users, duels, and other records. Only use these commands for local development/testing. Never run them against a production or shared database.**

#### Mac

```bash
dropdb cfduel
createdb cfduel
psql -d cfduel -v ON_ERROR_STOP=1 -f migrations/001_users.sql
psql -d cfduel -v ON_ERROR_STOP=1 -f migrations/002_duels.sql
```

#### Windows (Git Bash + Docker)

```bash
docker start cfduel-postgres
docker exec cfduel-postgres dropdb -U postgres cfduel
docker exec cfduel-postgres createdb -U postgres cfduel
docker exec -i cfduel-postgres psql -U postgres -d cfduel -v ON_ERROR_STOP=1 < migrations/001_users.sql
docker exec -i cfduel-postgres psql -U postgres -d cfduel -v ON_ERROR_STOP=1 < migrations/002_duels.sql
```

**Note:** Stop your backend server before resetting the database. Active connections can prevent `dropdb` from succeeding.

These commands reset only the `cfduel` database, not `cfduel_test` or other PostgreSQL databases.

### Running the server

```bash
npm start                     # http://localhost:3000 
```

The API is documented in [`docs/openapi.yaml`](docs/openapi.yaml).

### Running tests

Tests use a separate database, `cfduel_test`, which they wipe and rebuild on every run.

Copy backend/.env.example.test to backend/.env.test before running integration tests.

```bash
createdb cfduel_test
```

For windows:
```
docker exec cfduel-postgres createdb -U postgres cfduel_test
```

Create `backend/.env.test` (gitignored), with `USER` replaced by your username (postgres for windows):

```env
DATABASE_URL=postgres://USER@localhost:5432/cfduel_test
NODE_ENV=test
JWT_SECRET=your-test-jwt-secret
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

### Summary (full running instructions for Windows)
```bash
cd frontend
npm run dev
```

Make sure Docker Desktop is running, then:
```bash
cd backend
docker start cfduel-postgres
node --watch --env-file=.env src/server.js  # --watch to restart on change
```
