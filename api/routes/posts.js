const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/posts - Simple version to restore functionality
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.body, p.author_id, p.created_at, 
              u.username AS author
       FROM posts p
       JOIN users u ON p.author_id = u.id
       ORDER BY p.created_at DESC 
       LIMIT 10`
    );
    res.json({ posts: result.rows, totalPages: 1 });
  } catch (err) {
    console.error("Critical Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Single post detail (Simple)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS author FROM posts p 
       JOIN users u ON p.author_id = u.id WHERE p.id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Basic Create
router.post("/", auth, async (req, res) => {
  try {
    const { title, body } = req.body;
    const result = await pool.query(
      "INSERT INTO posts (title, body, author_id) VALUES ($1, $2, $3) RETURNING *",
      [title, body, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
