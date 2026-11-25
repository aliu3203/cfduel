import pool from '../db.js';
import { validateHistorySearch } from '../validation/duel.js';

export async function history(req, res) {
    const {username, oppHandle, problemNum, startDate, endDate} = req.query;
    const error = validateHistorySearch({username,oppHandle,problemNum,startDate,endDate});

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
        const { rows: totals } = await pool.query(
            `SELECT COUNT(*)::integer AS total
             FROM duels
             WHERE (player1_username = $1 OR player2_username = $1)
             AND status = 'finished'`,
            [username]
        );
        const playedBefore = totals[0].total > 0;

        if(!playedBefore){
            return res.status(200).json({duels:[], playedBefore:false})
        }

        //if user exists, find their finished duels
        //search based on username, opponent handle, problem number, start/end date
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
            AND ($4::text IS NULL OR duels.ended_at >= ($4::date::timestamp AT TIME ZONE 'PST'))
            AND ($5::text IS NULL OR duels.ended_at < ($5::date::timestamp AT TIME ZONE 'PST'))

            ORDER BY ended_at DESC`,
            [username,
            oppHandle||null,
            problemNum||null,
            startDate||null,
            endDate||null]
        );
        return res.status(200).json({ duels: DuelInfo, playedBefore:true});

    } catch (error) {
        return res.status(500).json({ error: "server error" });
    }
}
