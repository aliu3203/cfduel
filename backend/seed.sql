-- Sample data for LOCAL DEVELOPMENT ONLY. Never run this against a production or shared database:
-- it creates accounts whose password is published in the README.
--
-- Dev accounts (all use the password: password123)
--   alice, bob, carol
--
-- Safe to run more than once: it resets the dev accounts' passwords and only adds the sample duels
-- the first time.

-- The hash is bcrypt('password123'). Re-running fixes accounts made by an older seed with a fake hash.
INSERT INTO users (username, email, password_hash, rating) VALUES
    ('alice', 'alice@example.com', '$2b$12$MDBy2YrbASAkCf5qWVsYkOKndbJNR5Fr2DJ0D0XSHn1pehY.yDDv2', 1030),
    ('bob',   'bob@example.com',   '$2b$12$MDBy2YrbASAkCf5qWVsYkOKndbJNR5Fr2DJ0D0XSHn1pehY.yDDv2', 985),
    ('carol', 'carol@example.com', '$2b$12$MDBy2YrbASAkCf5qWVsYkOKndbJNR5Fr2DJ0D0XSHn1pehY.yDDv2', 1000)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Sample duels, skipped if the dev accounts already have duels with each other
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM duels
        WHERE player1_username IN ('alice', 'bob', 'carol')
          AND player2_username IN ('alice', 'bob', 'carol')
    ) THEN
        RETURN;
    END IF;

    -- Finished duels (these appear in history, newest first)
    INSERT INTO duels (
        player1_username, player2_username, status, result,
        player1_old_elo, player2_old_elo, player1_rating_delta, player2_rating_delta,
        problem_id, started_at, ended_at
    ) VALUES
        -- alice beats bob (green for alice)
        ('alice', 'bob', 'finished', 'player1', 1000, 1000, 15, -15, '1850A',
            now() - interval '3 days 1 hour', now() - interval '3 days'),
        -- carol beats alice (red for alice)
        ('carol', 'alice', 'finished', 'player1', 990, 1015, 16, -16, '1851B',
            now() - interval '2 days 1 hour', now() - interval '2 days'),
        -- alice and bob draw (gray for alice)
        ('bob', 'alice', 'finished', 'draw', 985, 999, 0, 0, '1852C',
            now() - interval '1 day 1 hour', now() - interval '1 day');

    -- An active duel, which should NOT show up in history
    INSERT INTO duels (player1_username, player2_username, status, started_at)
    VALUES ('alice', 'carol', 'active', now() - interval '10 minutes');
END $$;
