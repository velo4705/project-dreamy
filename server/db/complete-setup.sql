-- ============================================
-- COMPLETE DATABASE SETUP FOR DBMS PROJECT
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    body        TEXT,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create index for votes
CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id              SERIAL PRIMARY KEY,
    body            TEXT NOT NULL,
    author_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Add full-text search to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- Create search trigger function
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.body, '')),  'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS trg_posts_search_vector ON posts;
CREATE TRIGGER trg_posts_search_vector
    BEFORE INSERT OR UPDATE OF title, body ON posts
    FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert users (only if not exists)
INSERT INTO users (username, email, password) VALUES
('alice', 'alice@example.com', '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO'),
('bob', 'bob@example.com', '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO'),
('charlie', 'charlie@example.com', '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO')
ON CONFLICT (username) DO NOTHING;

-- Insert posts (only if not exists)
INSERT INTO posts (title, body, author_id) VALUES
('Welcome to Dreamy!', 'This is the first post on our beautiful social platform. Feel free to upvote and comment!', 1),
('PostgreSQL Tips and Tricks', 'Here are some useful PostgreSQL features: CTEs, window functions, and full-text search with tsvector.', 2),
('Best practices for database design', 'Always normalize your tables, use proper indexes, and define foreign key constraints.', 3),
('Introduction to SQL Joins', 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN - when to use each one and why.', 1),
('My favorite programming languages', 'JavaScript for web development, Python for data science, and Rust for systems programming.', 2)
ON CONFLICT DO NOTHING;

-- Insert votes (only if not exists)
INSERT INTO votes (user_id, post_id, value) VALUES
(1, 2, 1),   -- alice upvotes bob's post
(1, 3, 1),   -- alice upvotes charlie's post
(2, 1, 1),   -- bob upvotes alice's post
(2, 3, -1),  -- bob downvotes charlie's post
(3, 1, 1),   -- charlie upvotes alice's post
(3, 2, 1),   -- charlie upvotes bob's post
(3, 4, 1)    -- charlie upvotes alice's second post
ON CONFLICT (user_id, post_id) DO NOTHING;

-- Insert comments (only if not exists) - FIXED: using NULL instead of empty strings
INSERT INTO comments (body, author_id, post_id, parent_id) VALUES
('Great first post! Welcome everyone.', 2, 1, NULL),
('Thanks Bob! Glad to have you here.', 1, 1, 1),
('tsvector is amazing for search.', 3, 2, NULL),
('I agree, normalization is key.', 1, 3, NULL),
('But sometimes denormalization is practical.', 2, 3, 4)
ON CONFLICT DO NOTHING;