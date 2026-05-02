const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/posts/:postId/comments - Add a comment (auth required)
// Body: { "body": "...", "parent_id": null | commentId }
router.post("/posts/:postId/comments", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { body, parent_id } = req.body;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: "Comment body is required" });
    }

    // Check post exists
    const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // If replying to a comment, verify parent exists and belongs to same post
    if (parent_id) {
      const parent = await pool.query(
        "SELECT id FROM comments WHERE id = $1 AND post_id = $2",
        [parent_id, postId]
      );
      if (parent.rows.length === 0) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    const result = await pool.query(
      `INSERT INTO comments (body, author_id, post_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, author_id, post_id, parent_id, created_at`,
      [body.trim(), req.user.id, postId, parent_id || null]
    );

    const comment = result.rows[0];
    comment.author = req.user.username;

    res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/:postId/comments - List comments for a post
// Returns a flat list ordered by created_at; frontend can nest via parent_id
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    // Check post exists
    const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const result = await pool.query(
      `SELECT c.id, c.body, c.author_id, c.post_id, c.parent_id, c.created_at,
              u.username AS author
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("List comments error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/comments/:id - Delete own comment (auth required)
router.delete("/comments/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      "SELECT id, author_id FROM comments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    await pool.query("DELETE FROM comments WHERE id = $1", [id]);

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
