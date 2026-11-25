import pool from '../db.js';
import bcrypt from 'bcrypt';
import validateRegister from '../validation/auth.js';
import jwt from 'jsonwebtoken';

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
        
        // JWT: send the user a cookie
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET, // server signs the cookie
            { expiresIn: '24h' } // token lifetime = cookie lifetime
        );
        
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // during testing, cookies can be sent over insecure http
            maxAge: 24 * 60 * 60 * 1000 // in milliseconds (1 day)
        });
        // there is a set-cookie header in the response by this point

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

async function me(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id, username, cf_handle, rating
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "User does not exist" });
        }

        const user = rows[0];

        return res.status(200).json({
            id: user.id,
            username: user.username,
            cfHandle: user.cf_handle,
            rating: user.rating
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

function logout(req, res) {
    res.clearCookie('token', { // remove cookie on logout
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    return res.status(200).json({ message: "Logged out" });
}

export {register, login, me, logout};
