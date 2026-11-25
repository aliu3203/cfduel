import pool from '../db.js';
import { randomBytes } from 'node:crypto';

async function start (req, res) {
    const userId = req.user.id;
    const { cfHandle } = req.body ?? {};

    // Validate the requested handle
    if (typeof cfHandle !== 'string' ||
        !/^[a-zA-Z0-9_.-]{3,24}$/.test(cfHandle)) {
        return res.status(400).json({
            error: 'Invalid Codeforces handle'
        });
    }

   try {
        const { rows } = await pool.query(
            `SELECT username, cf_handle FROM users WHERE id = $1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Reject handles already verified by another user
        const existing = await pool.query(
            `SELECT id FROM users WHERE cf_handle = $1`,
            [cfHandle]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: 'Codeforces handle is already claimed'
            });
        }

        // Generate a random, short-lived challenge (10 mins to enter)
        const cfCode = 'cfduel_' + randomBytes(8).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Create or replace this user's pending verification
        await pool.query(
            `INSERT INTO cf_verifications
                (username, cf_handle, cf_code, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username)
            DO UPDATE SET
                cf_handle = EXCLUDED.cf_handle,
                cf_code = EXCLUDED.cf_code,
                created_at = NOW(),
                expires_at = EXCLUDED.expires_at`,
            [rows[0].username, cfHandle, cfCode, expiresAt]
        );

        return res.status(200).json({
            cfCode,
            expiresAt: expiresAt.toISOString()
        });

    } catch( err ) {        
        console.error('CF verification start failed:', err);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}

async function confirm(req, res) {
    const userId = req.user.id;

    try {
        const { rows: userrows } = await pool.query(
            `SELECT username, cf_handle FROM users WHERE id = $1`,
            [userId]
        );

        if (userrows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { rows: targetrows } = await pool.query(
            `SELECT expires_at, cf_handle, cf_code
             FROM cf_verifications
             WHERE username = $1`,
            [userrows[0].username]
        );

        if (targetrows.length === 0) {
            return res.status(404).json({
                error: 'No pending Codeforces verification'
            });
        }

        if (targetrows[0].expires_at.getTime() <= Date.now()) {
            return res.status(410).json({
                error: 'Verification code expired'
            });
        }

        // Query Codeforces API to verify handle ownership
        let cfQuery;

        try {
            cfQuery = await fetch(
                `https://codeforces.com/api/user.info?handles=${encodeURIComponent(targetrows[0].cf_handle)}`,
                { signal: AbortSignal.timeout(8000) }
            );
        } catch (err) {
            if (err.name === 'TimeoutError' || err.name === 'AbortError') {
                return res.status(504).json({
                    error: 'Codeforces API timed out. Please try again.'
                });
            }

            return res.status(502).json({
                error: 'Could not connect to Codeforces'
            });
        }

        if (!cfQuery.ok) {
            return res.status(502).json({
                error: 'Codeforces API returned an error'
            });
        }

        const cfData = await cfQuery.json();

        if (cfData.status !== 'OK' || !cfData.result?.[0]) {
            return res.status(502).json({
                error: 'Could not retrieve Codeforces user'
            });
        }

        const cfUser = cfData.result[0];

        if (cfUser.firstName !== targetrows[0].cf_code) {
            return res.status(400).json({
                error: 'Verification code does not match yet. If you just updated your Codeforces first name, wait about 30 seconds and try again.'
            });
        }

        // Atomically link the CF handle and remove the pending verification
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Lock the pending verification to prevent concurrent changes
            const { rows: currentrows } = await client.query(
                `SELECT cf_handle, cf_code, expires_at
                 FROM cf_verifications
                 WHERE username = $1
                 FOR UPDATE`,
                [userrows[0].username]
            );

            if (currentrows.length === 0 ||
                currentrows[0].cf_code !== targetrows[0].cf_code ||
                currentrows[0].cf_handle !== targetrows[0].cf_handle) {

                await client.query('ROLLBACK');

                return res.status(409).json({
                    error: 'Verification request changed. Please try again.'
                });
            }

            if (currentrows[0].expires_at.getTime() <= Date.now()) {
                await client.query('ROLLBACK');

                return res.status(410).json({
                    error: 'Verification code expired'
                });
            }

            // Update the user's linked Codeforces handle
            const updated = await client.query(
                `UPDATE users
                 SET cf_handle = $1
                 WHERE username = $2
                 RETURNING cf_handle`,
                [currentrows[0].cf_handle, userrows[0].username]
            );

            // Delete the completed verification challenge
            await client.query(
                `DELETE FROM cf_verifications
                 WHERE username = $1`,
                [userrows[0].username]
            );

            await client.query('COMMIT');

            return res.status(200).json({
                cfHandle: updated.rows[0].cf_handle
            });

        } catch (err) {
            await client.query('ROLLBACK');

            // PostgreSQL unique constraint violation
            if (err.code === '23505') {
                return res.status(409).json({
                    error: 'Codeforces handle is already claimed'
                });
            }

            throw err;

        } finally {
            client.release();
        }

    } catch (err) {
        console.error('CF verification confirm failed:', err);

        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}

export {start, confirm};
