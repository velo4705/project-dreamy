-- Seed data for reddit_clone
-- Passwords are bcrypt hashes of "password123"

INSERT INTO users (username, email, password) VALUES
('alice',   'alice@example.com',   '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO'),
('bob',     'bob@example.com',     '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO'),
('charlie', 'charlie@example.com', '$2b$10$fZcqzrJcHtg6cuY4opPS0uRSahQ1JOJAlH7x0TOouASpnQETgIwTO');

INSERT INTO posts (title, body, author_id) VALUES
('Welcome to RedditClone!',
 'This is the first post on our new platform. Feel free to upvote and comment!',
 1),
('PostgreSQL Tips and Tricks',
 'Here are some useful PostgreSQL features: CTEs, window functions, and full-text search with tsvector.',
 2),
('Best practices for database design',
 'Always normalize your tables, use proper indexes, and define foreign key constraints.',
 3),
('Introduction to SQL Joins',
 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN - when to use each one and why.',
 1),
('My favorite programming languages',
 'JavaScript for web development, Python for data science, and Rust for systems programming.',
 2);

INSERT INTO votes (user_id, post_id, value) VALUES
(1, 2,  1),   -- alice upvotes bob's post
(1, 3,  1),   -- alice upvotes charlie's post
(2, 1,  1),   -- bob upvotes alice's post
(2, 3, -1),   -- bob downvotes charlie's post
(3, 1,  1),   -- charlie upvotes alice's post
(3, 2,  1),   -- charlie upvotes bob's post
(3, 4,  1);   -- charlie upvotes alice's second post

INSERT INTO comments (body, author_id, post_id, parent_id) VALUES
('Great first post! Welcome everyone.',          2, 1, NULL),
('Thanks Bob! Glad to have you here.',           1, 1, 1),
('tsvector is amazing for search.',              3, 2, NULL),
('I agree, normalization is key.',               1, 3, NULL),
('But sometimes denormalization is practical.',   2, 3, 4);
