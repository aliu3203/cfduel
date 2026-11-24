CREATE EXTENSION IF NOT EXISTS citext;

-- KEY ASSUMPTIONS:
-- One user to one cf_handle exactly (since many causes issue if these players pair up)
-- Can have multiple requests of a user sending a key, only one of them is valid (make user)
CREATE TABLE IF NOT EXISTS cf_verifications (
    id BIGSERIAL PRIMARY KEY,
    username CITEXT NOT NULL UNIQUE REFERENCES users(username),
    cf_handle CITEXT NOT NULL,
    cf_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);