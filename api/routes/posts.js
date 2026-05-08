const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const router = express.Router();

// GET /api/posts/search - Search posts
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ posts: [], total: 0, totalPages: 0 });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, p.media,
              u.username AS author, u.avatar_url AS author_avatar
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.title ILIKE $1 OR p.body ILIKE $1
       ORDER BY p.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    const countRes = await pool.query(
      "SELECT COUNT(*)::int as total FROM posts WHERE title ILIKE $1 OR body ILIKE $1",
      [`%${q}%`]
    );
    const total = countRes.rows[0].total;

    res.json({ 
      posts: result.rows,
      total: total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts - Feed
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sort = req.query.sort === "top" ? "score" : "new";

    let userId = 0;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) { userId = 0; }
    }

    const orderBy = sort === "score" ? "score DESC, p.created_at DESC" : "p.created_at DESC";

    const sql = `
      SELECT 
        p.id, p.title, p.body, p.author_id, p.created_at, p.updated_at,
        p.media_url, p.media_type, p.media, p.parent_post_id,
        u.username AS author,
        u.avatar_url AS author_avatar,
        parent.title AS parent_title,
        COALESCE(v.score, 0)::int AS score,
        COALESCE(c.comment_count, 0)::int AS comment_count,
        COALESCE(uv.value, 0)::int AS user_vote
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN posts parent ON p.parent_post_id = parent.id
      LEFT JOIN (SELECT post_id, SUM(value) as score FROM votes GROUP BY post_id) v ON v.post_id = p.id
      LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) c ON c.post_id = p.id
      LEFT JOIN (SELECT post_id, value FROM votes WHERE user_id = $1) uv ON uv.post_id = p.id
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(sql, [userId, limit, offset]);
    const countRes = await pool.query("SELECT COUNT(*)::int as total FROM posts");
    const total = countRes.rows[0].total;

    res.json({
      posts: result.rows,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id - Detail
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let userId = 0;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) { userId = 0; }
    }

    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, p.updated_at,
              p.media_url, p.media_type, p.media, p.parent_post_id,
              u.username AS author,
              u.avatar_url AS author_avatar,
              parent.title AS parent_title,
              (SELECT COALESCE(SUM(value), 0)::int FROM votes WHERE post_id = p.id) AS score,
              COALESCE((SELECT value FROM votes WHERE user_id = $2 AND post_id = p.id), 0)::int AS user_vote
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN posts parent ON p.parent_post_id = parent.id
       WHERE p.id = $1`,
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/comments - List comments
router.get("/:id/comments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username AS author, u.avatar_url AS author_avatar
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/comments - Add a comment
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { body, parent_id } = req.body;
    const author_id = req.user.id;

    const result = await pool.query(
      "INSERT INTO comments (post_id, author_id, body, parent_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, author_id, body, parent_id]
    );

    const commentWithAuthor = await pool.query(
      `SELECT c.*, u.username AS author, u.avatar_url AS author_avatar 
       FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(commentWithAuthor.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/vote - Vote
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    const userId = req.user.id;

    const postId = parseInt(id);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid post ID" });

    await pool.query(
      "DELETE FROM votes WHERE user_id = $1 AND post_id = $2",
      [userId, postId]
    );

    if (value !== 0) {
      await pool.query(
        "INSERT INTO votes (user_id, post_id, value) VALUES ($1, $2, $3)",
        [userId, postId, value]
      );
    }

    const scoreResult = await pool.query(
      "SELECT COALESCE(SUM(value), 0)::int AS score FROM votes WHERE post_id = $1",
      [postId]
    );

    res.json({ score: scoreResult.rows[0].score, user_vote: value });
  } catch (err) {
    console.error("Vote Error:", err);
    res.status(500).json({ error: "Voting failed: " + err.message });
  }
});

// POST /api/posts - Create
router.post("/", auth, async (req, res) => {
  try {
    const { title, body, parent_post_id, media_url, media_type, media } = req.body;
    const result = await pool.query(
      "INSERT INTO posts (title, body, author_id, parent_post_id, media_url, media_type, media) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, body, req.user.id, parent_post_id, media_url, media_type, JSON.stringify(media || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
