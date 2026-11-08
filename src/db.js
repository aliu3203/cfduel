const { Pool }  = require('pg');

if(!process.env.DATABASE_URL){
    throw new Error("DATABASE_URL is not set yet (check your .env)")
}

