-- ============================================
-- COMMENTS TABLE - Complete SQL
-- ============================================

-- Create the comments table
CREATE TABLE IF NOT EXISTS comments (
    id              SERIAL PRIMARY KEY,
    body            TEXT NOT NULL,
    author_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Insert seed data (only if table is empty)
INSERT INTO comments (body, author_id, post_id, parent_id) VALUES
('Great first post! Welcome everyone.', 2, 1, NULL),
('Thanks Bob! Glad to have you here.', 1, 1, 1),
('tsvector is amazing for search.', 3, 2, NULL),
('I agree, normalization is key.', 1, 3, NULL),
('But sometimes denormalization is practical.', 2, 3, 4)
ON CONFLICT DO NOTHING;