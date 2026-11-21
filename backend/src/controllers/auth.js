import pool from '../db.js';
import bcrypt from 'bcrypt';
import {validateRegister} from '../validation/auth.js';

const SALT_ROUNDS = 12; 

export async function register (req, res) {
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

