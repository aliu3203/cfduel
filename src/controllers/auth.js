const pool = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function register (req, res) {
    const {username, email, password} = req.body ?? {};
    
    //input validation
    if ( !username || !email || !password ){
        return res.status(400).json({error: "something is empty"});
    }
    
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    //add to db

    try {
        const { rows } = await pool.query(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email`,
            [username, email, password_hash]
        );

        return res.status(201).json(rows[0]);
    } catch( err ){
        return res.status(409).json({error: "error in db insert"});
    }

    
}



// exports

module.exports = {register};
