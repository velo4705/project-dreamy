const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/posts - Create a new post (auth required)
router.post("/", auth, async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.length > 300) {
      return res.status(400).json({ error: "Title must be 300 characters or less" });
    }

    const result = await pool.query(
      `INSERT INTO posts (title, body, author_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, body, author_id, created_at, updated_at`,
      [title.trim(), body || null, req.user.id]
    );

    const post = result.rows[0];
    post.author = req.user.username;
    post.score = 0;
    post.comment_count = 0;
    post.user_vote = 0;

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/search?q=...&page=1&limit=20 - Full-text search
// Uses PostgreSQL tsvector/tsquery with ranking
// MUST be defined before GET /:id to avoid "search" matching as an id
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Optional auth
    let userId = null;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const tsquery = q.trim().split(/\s+/).join(" & ");

    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, p.updated_at,
              u.username AS author,
              COALESCE(SUM(v.value), 0)::int AS score,
              COUNT(DISTINCT c.id)::int AS comment_count,
              COALESCE(
                (SELECT value FROM votes WHERE user_id = $1 AND post_id = p.id),
                0
              )::int AS user_vote,
              ts_rank(p.search_vector, to_tsquery('english', $2)) AS rank
       FROM posts p
       JOIN users u ON p.author_id = u.id
       LEFT JOIN votes v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.search_vector @@ to_tsquery('english', $2)
       GROUP BY p.id, u.username
       ORDER BY rank DESC, p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, tsquery, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM posts
       WHERE search_vector @@ to_tsquery('english', $1)`,
      [tsquery]
    );
    const total = countResult.rows[0].total;

    res.json({
      posts: result.rows,
      query: q,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts - List posts with pagination
// Query params: ?sort=top|new  &page=1  &limit=20
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const sort = req.query.sort === "top" ? "score" : "new";

    // Extract user id from token if present (optional auth)
    let userId = null;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const orderBy = sort === "score"
      ? "score DESC, p.created_at DESC"
      : "p.created_at DESC";

    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, p.updated_at,
              u.username AS author,
              COALESCE(SUM(v.value), 0)::int AS score,
              COUNT(DISTINCT c.id)::int AS comment_count,
              COALESCE(
                (SELECT value FROM votes WHERE user_id = $1 AND post_id = p.id),
                0
              )::int AS user_vote
       FROM posts p
       JOIN users u ON p.author_id = u.id
       LEFT JOIN votes v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       GROUP BY p.id, u.username
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM posts");
    const total = countResult.rows[0].total;

    res.json({
      posts: result.rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("List posts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/:id - Single post detail
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Optional auth
    let userId = null;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, p.updated_at,
              u.username AS author,
              COALESCE(SUM(v.value), 0)::int AS score,
              COUNT(DISTINCT c.id)::int AS comment_count,
              COALESCE(
                (SELECT value FROM votes WHERE user_id = $1 AND post_id = p.id),
                0
              )::int AS user_vote
       FROM posts p
       JOIN users u ON p.author_id = u.id
       LEFT JOIN votes v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.id = $2
       GROUP BY p.id, u.username`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/posts/:id - Edit own post (auth required)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    // Check ownership
    const existing = await pool.query("SELECT author_id FROM posts WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.length > 300) {
      return res.status(400).json({ error: "Title must be 300 characters or less" });
    }

    const result = await pool.query(
      `UPDATE posts SET title = $1, body = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, body, author_id, created_at, updated_at`,
      [title.trim(), body || null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/posts/:id - Delete own post (auth required)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query("SELECT author_id FROM posts WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await pool.query("DELETE FROM posts WHERE id = $1", [id]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:id/vote - Upvote or downvote (auth required)
// Body: { "value": 1 } for upvote, { "value": -1 } for downvote
// Sending the same value again removes the vote (toggle)
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { value } = req.body;

    if (value !== 1 && value !== -1) {
      return res.status(400).json({ error: "Value must be 1 or -1" });
    }

    // Check post exists
    const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user already voted on this post
    const existing = await pool.query(
      "SELECT id, value FROM votes WHERE user_id = $1 AND post_id = $2",
      [req.user.id, postId]
    );

    let userVote = 0;

    if (existing.rows.length === 0) {
      // No existing vote - insert new vote
      await pool.query(
        "INSERT INTO votes (user_id, post_id, value) VALUES ($1, $2, $3)",
        [req.user.id, postId, value]
      );
      userVote = value;
    } else if (existing.rows[0].value === value) {
      // Same vote again - remove it (toggle off)
      await pool.query("DELETE FROM votes WHERE id = $1", [existing.rows[0].id]);
      userVote = 0;
    } else {
      // Different vote - update it (e.g. upvote -> downvote)
      await pool.query("UPDATE votes SET value = $1 WHERE id = $2", [value, existing.rows[0].id]);
      userVote = value;
    }

    // Return updated score
    const scoreResult = await pool.query(
      "SELECT COALESCE(SUM(value), 0)::int AS score FROM votes WHERE post_id = $1",
      [postId]
    );

    res.json({
      post_id: parseInt(postId),
      score: scoreResult.rows[0].score,
      user_vote: userVote,
    });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
