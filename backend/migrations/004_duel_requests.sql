ALTER TABLE duels

-- Problem rating is stored within the duel, and used to pick the problem on start
ADD COLUMN IF NOT EXISTS problem_rating INT
    CHECK (
        problem_rating BETWEEN 800 AND 3500
        AND problem_rating % 100 = 0
    );

-- Duels should be able to expire
ALTER TABLE duels
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE duels
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;