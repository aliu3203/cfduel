import pool from '../db.js';
import bcrypt from 'bcrypt';
import validateRegister from '../validation/auth.js';

const SALT_ROUNDS = 12; 

async function register (req, res) {
    const {username, email, password} = req.body ?? {};

    //input validation
    const error = validateRegister( { username, email, password });

    if(error){
        return res.status(400).json({error: error});
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    //add to db

    try {
        const { rows } = await pool.query(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, rating`,
            [username, email, password_hash]
        );

        return res.status(201).json(rows[0]);
    } catch( err ){
        // Unique violation for username/email
        if(err.code === "23505"){
            return res.status(409).json({error: "username/email already taken"});
        }
        throw err;
    }
}


async function login(req, res) {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" ||
        typeof password !== "string" ||
        !username || !password) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        const { rows } = await pool.query(
            `SELECT id, username, password_hash, rating
             FROM users
             WHERE username = $1`,
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = rows[0];

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        return res.status(200).json({
            id: user.id,
            username: user.username,
            rating: user.rating
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// exports

export {register, login};