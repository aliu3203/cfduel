import pool from '../db.js';
import { validateUsernameInfo } from '../validation/duel.js';

export async function history(req, res) {
    const { username } = req.query;

    const error = validateUsernameInfo({ username });

    if (error) {
        return res.status(400).json({ error: error });
    }

    try {
        //checking from the data base to see if the user exists
        const { rows: UserInfo } = await pool.query(
            `SELECT 1
            FROM users
            WHERE username = $1
            LIMIT 1`,
            [username]
        ); //if not, return error
        if (UserInfo.length === 0) {
            return res.status(404).json({ error: "user doesn't exist in the database" });
        }
        //if user exists, find their finished duels
        const { rows: DuelInfo } = await pool.query(
            `SELECT *
            FROM duels
            WHERE (player1_username = $1 OR player2_username = $1) AND status = 'finished'
            ORDER BY ended_at DESC`,
            [username]
        );
        return res.status(200).json({ duels: DuelInfo });

    } catch (error) {
        return res.status(500).json({ error: "server error" });
    }
}
