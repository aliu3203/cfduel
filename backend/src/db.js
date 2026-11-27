import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set yet (check your .env)");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client:', err);
});

export default pool;
