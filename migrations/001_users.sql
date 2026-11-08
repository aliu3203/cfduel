CREATE TABLE if NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE, -- we constraint usernames to be 30 characters
    email VARCHAR(253) NOT NULL UNIQUE, -- 50 char limit
    password_hash TEXT NOT NULL,
    cf_handle VARCHAR(24) UNIQUE, -- can be empty if cf not synced
    rating INT NOT NULL DEFAULT 1000
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- claude says we should use CITEXT instead of VARCHAR for case insensitive emails, etc...
