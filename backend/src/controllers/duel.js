import pool from '../db.js';
import { validateHistorySearch } from '../validation/duel.js';

export async function history(req, res) {
    const {oppHandle, problemNum, startDate, endDate} = req.query;
    const error = validateHistorySearch({oppHandle,problemNum,startDate,endDate});

    if (error) {
        return res.status(400).json({ error });
    }

    try {
        //the searcher is always the logged-in user (set by requireAuth), never a query param
        const { rows: UserInfo } = await pool.query(
            `SELECT username
            FROM users
            WHERE id = $1`,
            [req.user.id]
        ); //the token is valid but the account was deleted
        if (UserInfo.length === 0) {
            return res.status(401).json({ error: "User does not exist" });
        }
        const username = UserInfo[0].username;

        const { rows: totals } = await pool.query(
            `SELECT EXISTS (
            SELECT 1
            FROM duels
            WHERE (player1_username = $1 OR player2_username = $1)
            AND status = 'finished'
            ) AS has_played`,
            [username]
        );
        const playedBefore = totals[0].has_played;

        if(!playedBefore){
            return res.status(200).json({duels:[], playedBefore:false});
        }

        //optional filters: opponent handle, problem number, start/end date
        const { rows: DuelInfo } = await pool.query(
            `SELECT duels.*, users.cf_handle FROM duels
            JOIN users 
                ON users.username = CASE
                    WHEN duels.player1_username = $1::citext
                    THEN duels.player2_username
                    ELSE duels.player1_username
                END
            WHERE (duels.player1_username = $1 OR duels.player2_username = $1) AND duels.status = 'finished'
            AND ($2::text IS NULL OR users.cf_handle = $2::citext)
            AND ($3::text IS NULL OR LOWER(duels.problem_id) = LOWER($3::text))
            AND ($4::text IS NULL OR duels.ended_at >= ($4::date::timestamp AT TIME ZONE 'America/Los_Angeles'))
            AND ($5::text IS NULL OR duels.ended_at < (($5::date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles'))
            ORDER BY ended_at DESC`,
            [username,
            oppHandle||null,
            problemNum||null,
            startDate||null,
            endDate||null]
        );
        return res.status(200).json({ duels: DuelInfo, playedBefore:true});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "server error" });
    }
}
