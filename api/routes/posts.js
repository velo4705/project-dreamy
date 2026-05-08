const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /api/posts - Create a new post (auth required)
router.post("/", auth, async (req, res) => {
  try {
    const { title, body, parent_post_id, media_url, media_type } = req.body;
    const author_id = req.user.id;

    const result = await pool.query(
      "INSERT INTO posts (title, body, author_id, parent_post_id, media_url, media_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, body, author_id, parent_post_id, media_url, media_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts - List posts with pagination
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sort = req.query.sort === "top" ? "score" : "new";

    // Optional auth for user_vote
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
        p.media_url, p.media_type, p.parent_post_id,
        u.username AS author,
        u.avatar_url AS author_avatar,
        COALESCE(v.score, 0)::int AS score,
        COALESCE(c.comment_count, 0)::int AS comment_count,
        COALESCE(uv.value, 0)::int AS user_vote
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN (SELECT post_id, SUM(value) as score FROM votes GROUP BY post_id) v ON v.post_id = p.id
      LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) c ON c.post_id = p.id
      LEFT JOIN (SELECT post_id, value FROM votes WHERE user_id = $1) uv ON uv.post_id = p.id
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;

    let result;
    try {
      result = await pool.query(sql, [userId, limit, offset]);
    } catch (dbErr) {
      console.error("DB Error:", dbErr.message);
      return res.json({ 
        posts: [{ 
          id: 999, 
          title: "🚨 SQL ERROR DETECTED", 
          body: dbErr.message, 
          author: "Debugger",
          author_avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=debug",
          created_at: new Date()
        }], 
        totalPages: 1 
      });
    }

    const countRes = await pool.query("SELECT COUNT(*)::int as total FROM posts");
    const total = countRes.rows[0].total;

    res.json({
      posts: result.rows,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error("Global Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id - Single post detail
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
              p.media_url, p.media_type, p.parent_post_id,
              u.username AS author,
              u.avatar_url AS author_avatar,
              (SELECT COALESCE(SUM(value), 0)::int FROM votes WHERE post_id = p.id) AS score,
              COALESCE((SELECT value FROM votes WHERE user_id = $2 AND post_id = p.id), 0)::int AS user_vote
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
