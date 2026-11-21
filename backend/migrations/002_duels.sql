-- KEY ASSUMPTIONS:
-- Store ALL active + completed duels
-- Usernames and their corresponding cf_handles are immutable, will never change
-- Player 1 is the challenger, player 2 is the player who accepts
CREATE TABLE IF NOT EXISTS duels (
    id BIGSERIAL PRIMARY KEY,

    -- Players (immutable usernames)
    player1_username CITEXT NOT NULL REFERENCES users(username),
    player2_username CITEXT NOT NULL REFERENCES users(username),

    -- Match lifecycle
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'finished', 'cancelled')),

    player1_ready BOOLEAN NOT NULL DEFAULT FALSE,
    player2_ready BOOLEAN NOT NULL DEFAULT FALSE,

    -- Codeforces problem
    problem_id TEXT,

    -- Outcome
    result TEXT
        CHECK (result IN ('player1', 'player2', 'draw')),

    -- Rating information
    player1_old_elo INT,
    player2_old_elo INT,
    player1_rating_delta INT,
    player2_rating_delta INT,

    -- Time information
    duration_seconds INT NOT NULL DEFAULT 7200
        CHECK (duration_seconds > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Accepted submission information
    player1_submission_at TIMESTAMPTZ,
    player2_submission_at TIMESTAMPTZ,

    -- Players must be different
    CHECK (player1_username <> player2_username),

    -- started_at must be present for an active duel
    CHECK (
        status NOT IN ('active', 'finished')
        OR started_at IS NOT NULL
    )

    -- Finished duels must have a result
    CHECK (
        (status = 'finished' AND result IS NOT NULL)
        OR
        (status <> 'finished' AND result IS NULL)
    )
);