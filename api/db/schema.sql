-- Reddit Clone Database Schema
-- Database: reddit_clone

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    body        TEXT,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- ============================================
-- VOTES TABLE
-- Each user can vote once per post: +1 (upvote) or -1 (downvote)
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_votes_post ON votes(post_id);

-- ============================================
-- COMMENTS TABLE
-- Supports nested comments via parent_id (self-referencing)
-- ============================================
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    body            TEXT NOT NULL,
    author_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================
-- FULL-TEXT SEARCH INDEX (for Milestone 7)
-- ============================================
ALTER TABLE posts ADD COLUMN search_vector tsvector;

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.body, '')),  'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_search_vector
    BEFORE INSERT OR UPDATE OF title, body ON posts
    FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();
