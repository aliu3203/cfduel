CREATE TABLE if NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username CITEXT NOT NULL UNIQUE CHECK (char_length(username) <= 30), -- we constraint usernames to be 30 characters
    email CITEXT NOT NULL UNIQUE CHECK (char_length(email) <= 250), -- 250 char limit
    password_hash TEXT NOT NULL,
    cf_handle CITEXT UNIQUE, -- can be empty if cf not synced
    rating INT NOT NULL DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
